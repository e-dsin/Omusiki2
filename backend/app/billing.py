"""Logique d'abonnement commune aux paiements simulés (Stripe : carte, Aftawallet : mobile money).

Règles du MVP 1 :
- carte (Stripe)       : abonnement mensuel à renouvellement automatique, résiliable ;
- mobile money (Afta)  : pass prépayé de 30 ou 90 jours, sans renouvellement, prolongeable.
Les états sont recalculés à la lecture (renouvellement, expiration), ce qui évite toute tâche de fond.
"""
import sqlite3
from datetime import datetime, timezone

from . import config
from .db import new_id, now
from .errors import bad_request
from .mailbox import send_mail

DAY = 24 * 3600

# Tarifs FICTIFS, à valider par le comité
PLANS = [
    {
        "id": "premium_mensuel",
        "name": "Premium mensuel",
        "provider": "stripe",
        "kind": "subscription",
        "price": 4.99,
        "currency": "EUR",
        "periodDays": 30,
        "paymentMethod": "Carte bancaire",
        "description": "Renouvellement automatique chaque mois, résiliable à tout moment.",
    },
    {
        "id": "pass_30j",
        "name": "Pass 30 jours",
        "provider": "aftawallet",
        "kind": "pass",
        "price": 2000,
        "currency": "XAF",
        "periodDays": 30,
        "paymentMethod": "Mobile Money (MTN, Orange)",
        "description": "Accès illimité pendant 30 jours, sans renouvellement automatique.",
    },
    {
        "id": "pass_90j",
        "name": "Pass 90 jours",
        "provider": "aftawallet",
        "kind": "pass",
        "price": 5000,
        "currency": "XAF",
        "periodDays": 90,
        "paymentMethod": "Mobile Money (MTN, Orange)",
        "description": "Accès illimité pendant 90 jours, le plus avantageux.",
    },
]
PLANS_BY_ID = {p["id"]: p for p in PLANS}


def get_plan(plan_id: str) -> dict:
    plan = PLANS_BY_ID.get(plan_id)
    if not plan:
        raise bad_request("InvalidPlan", "Formule inconnue.")
    return plan


def iso(ts: float | None) -> str | None:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None


def fr_date(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%d/%m/%Y")


def _user_email(conn: sqlite3.Connection, user_id: str) -> str:
    row = conn.execute("SELECT email FROM users WHERE id = ?", (user_id,)).fetchone()
    return row["email"] if row else ""


def refresh_subscription(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row | None:
    """Applique renouvellements (carte) et expirations (pass / résiliation) échus."""
    sub = conn.execute("SELECT * FROM subscriptions WHERE user_id = ?", (user_id,)).fetchone()
    if not sub or sub["status"] != "active" or sub["current_period_end"] > now():
        return sub
    plan = PLANS_BY_ID[sub["plan_id"]]
    t = now()
    if sub["provider"] == "stripe" and not sub["cancel_at_period_end"]:
        end = sub["current_period_end"]
        while end <= t:
            end += plan["periodDays"] * DAY
            conn.execute(
                "INSERT INTO payments (id, user_id, plan_id, provider, amount, currency, status, reason, created_at, updated_at)"
                " VALUES (?, ?, ?, 'stripe', ?, ?, 'succeeded', 'renewal', ?, ?)",
                (new_id("pay"), user_id, plan["id"], plan["price"], plan["currency"], t, t),
            )
        conn.execute(
            "UPDATE subscriptions SET current_period_end = ?, updated_at = ? WHERE user_id = ?",
            (end, t, user_id),
        )
    else:
        status = "canceled" if sub["provider"] == "stripe" else "expired"
        conn.execute(
            "UPDATE subscriptions SET status = ?, updated_at = ? WHERE user_id = ?",
            (status, t, user_id),
        )
    return conn.execute("SELECT * FROM subscriptions WHERE user_id = ?", (user_id,)).fetchone()


def subscription_view(conn: sqlite3.Connection, user_id: str) -> dict:
    sub = refresh_subscription(conn, user_id)
    if not sub:
        return {"status": "none", "hasAccess": False}
    plan = PLANS_BY_ID[sub["plan_id"]]
    has_access = sub["status"] == "active" and sub["current_period_end"] > now()
    return {
        "status": sub["status"],
        "hasAccess": has_access,
        "planId": plan["id"],
        "planName": plan["name"],
        "kind": plan["kind"],
        "provider": sub["provider"],
        "currentPeriodEnd": iso(sub["current_period_end"]),
        "cancelAtPeriodEnd": bool(sub["cancel_at_period_end"]),
        "renews": sub["provider"] == "stripe" and not sub["cancel_at_period_end"] and has_access,
    }


def activate(conn: sqlite3.Connection, user_id: str, plan_id: str) -> None:
    """Active ou prolonge l'accès après un paiement réussi (effet du webhook PSP)."""
    plan = PLANS_BY_ID[plan_id]
    t = now()
    sub = refresh_subscription(conn, user_id)
    same_running_pass = (
        sub is not None
        and plan["kind"] == "pass"
        and sub["provider"] == "aftawallet"
        and sub["status"] == "active"
        and sub["current_period_end"] > t
    )
    start = sub["current_period_end"] if same_running_pass else t
    end = start + plan["periodDays"] * DAY
    conn.execute(
        "INSERT INTO subscriptions (user_id, plan_id, provider, status, current_period_end, cancel_at_period_end, created_at, updated_at)"
        " VALUES (?, ?, ?, 'active', ?, 0, ?, ?)"
        " ON CONFLICT(user_id) DO UPDATE SET plan_id = excluded.plan_id, provider = excluded.provider,"
        " status = 'active', current_period_end = excluded.current_period_end, cancel_at_period_end = 0,"
        " updated_at = excluded.updated_at",
        (user_id, plan_id, plan["provider"], end, t, t),
    )
    email = _user_email(conn, user_id)
    if plan["kind"] == "subscription":
        body = f"Votre abonnement {plan['name']} est actif. Prochain renouvellement le {fr_date(end)}."
    else:
        body = f"Votre {plan['name']} est actif jusqu'au {fr_date(end)}."
    send_mail(conn, email, "Confirmation de paiement Ô musiki", body)


def mark_payment(conn: sqlite3.Connection, payment_id: str, status: str, reason: str | None = None) -> None:
    conn.execute(
        "UPDATE payments SET status = ?, failure_reason = ?, updated_at = ? WHERE id = ?",
        (status, reason, now(), payment_id),
    )


def complete_payment(conn: sqlite3.Connection, payment: sqlite3.Row) -> None:
    """Paiement réussi : statut + activation (idempotent, comme un webhook rejoué)."""
    if payment["status"] == "succeeded":
        return
    mark_payment(conn, payment["id"], "succeeded")
    activate(conn, payment["user_id"], payment["plan_id"])


def finalize_aftawallet_if_due(conn: sqlite3.Connection, payment: sqlite3.Row) -> sqlite3.Row:
    """Simule la validation (ou le refus) du paiement sur le téléphone du client après un délai.

    Règle de test : un numéro se terminant par 0000 refuse le paiement.
    """
    if payment["status"] != "pending" or payment["provider"] != "aftawallet":
        return payment
    if now() - payment["created_at"] < config.AFTA_CONFIRM_DELAY_SECONDS:
        return payment
    if (payment["phone"] or "").endswith("0000"):
        mark_payment(conn, payment["id"], "failed", "CustomerDeclined")
    else:
        complete_payment(conn, payment)
    return conn.execute("SELECT * FROM payments WHERE id = ?", (payment["id"],)).fetchone()


def payment_view(conn: sqlite3.Connection, payment: sqlite3.Row) -> dict:
    plan = PLANS_BY_ID.get(payment["plan_id"], {})
    return {
        "id": payment["id"],
        "planId": payment["plan_id"],
        "planName": plan.get("name"),
        "provider": payment["provider"],
        "amount": payment["amount"],
        "currency": payment["currency"],
        "status": payment["status"],
        "failureReason": payment["failure_reason"],
        "reason": payment["reason"],
        "createdAt": iso(payment["created_at"]),
    }


def run_reminders(conn: sqlite3.Connection) -> int:
    """Rappel J-2 : renouvellement de l'abonnement carte ou fin du pass."""
    t = now()
    limit = t + config.REMINDER_DAYS * DAY
    sent = 0
    for sub in conn.execute(
        "SELECT * FROM subscriptions WHERE status = 'active' AND current_period_end BETWEEN ? AND ?",
        (t, limit),
    ).fetchall():
        plan = PLANS_BY_ID[sub["plan_id"]]
        email = _user_email(conn, sub["user_id"])
        if sub["provider"] == "stripe" and not sub["cancel_at_period_end"]:
            subject = "Votre abonnement Ô musiki sera renouvelé"
            body = (
                f"Votre abonnement {plan['name']} sera renouvelé le {fr_date(sub['current_period_end'])} "
                f"({plan['price']} {plan['currency']})."
            )
        else:
            subject = "Votre accès Ô musiki arrive à échéance"
            body = (
                f"Votre {plan['name']} se termine le {fr_date(sub['current_period_end'])}. "
                "Renouvelez-le pour continuer à écouter."
            )
        send_mail(conn, email, subject, body)
        sent += 1
    return sent
