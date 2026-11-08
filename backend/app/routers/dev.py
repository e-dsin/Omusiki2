"""Outils de test (désactivables avec OMUSIKI_DEV=0) : boîte mail, réinitialisation, pannes, horloge."""
import sqlite3

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .. import billing, db
from ..billing import DAY, iso
from ..db import get_db, now
from ..errors import not_found

router = APIRouter(prefix="/api/dev", tags=["Outils de test"])

# Réglages de simulation partagés avec le middleware (main.py)
SETTINGS = {"latencyMs": 0, "failRate": 0.0}


class SettingsIn(BaseModel):
    latencyMs: int = Field(0, ge=0, le=20000)
    failRate: float = Field(0.0, ge=0.0, le=1.0)


class DaysIn(BaseModel):
    days: float = 1


@router.get("/mailbox")
def mailbox(to: str = "", conn: sqlite3.Connection = Depends(get_db, scope="function")):
    if to:
        rows = conn.execute(
            "SELECT * FROM mailbox WHERE to_email = ? ORDER BY id DESC", (to.strip().lower(),)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM mailbox ORDER BY id DESC LIMIT 100").fetchall()
    return [
        {"to": r["to_email"], "subject": r["subject"], "body": r["body"], "code": r["code"], "at": iso(r["created_at"])}
        for r in rows
    ]


@router.delete("/mailbox")
def clear_mailbox(conn: sqlite3.Connection = Depends(get_db, scope="function")):
    conn.execute("DELETE FROM mailbox")
    return {"cleared": True}


@router.post("/reset")
def reset():
    """Efface toutes les données (comptes, favoris, paiements…)."""
    db.reset_db()
    SETTINGS.update(latencyMs=0, failRate=0.0)
    return {"reset": True}


@router.get("/settings")
def get_settings():
    return SETTINGS


@router.put("/settings")
def put_settings(body: SettingsIn):
    """Latence ajoutée et taux d'erreur 503 aléatoire sur toutes les routes /api (hors /api/dev)."""
    SETTINGS.update(latencyMs=body.latencyMs, failRate=body.failRate)
    return SETTINGS


def _user_id(conn, email: str) -> str:
    row = conn.execute("SELECT id FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
    if not row:
        raise not_found("UserNotFound", "Utilisateur inconnu.")
    return row["id"]


@router.post("/users/{email}/subscription/expire")
def expire_subscription(email: str, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Place la fin de période dans le passé (test d'expiration du pass ou de renouvellement carte)."""
    uid = _user_id(conn, email)
    conn.execute(
        "UPDATE subscriptions SET current_period_end = ? WHERE user_id = ?", (now() - 1, uid)
    )
    return billing.subscription_view(conn, uid)


@router.post("/users/{email}/subscription/ends-in")
def ends_in(email: str, body: DaysIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Rapproche l'échéance (test du rappel J-2)."""
    uid = _user_id(conn, email)
    conn.execute(
        "UPDATE subscriptions SET current_period_end = ? WHERE user_id = ?", (now() + body.days * DAY, uid)
    )
    return billing.subscription_view(conn, uid)


@router.post("/reminders/run")
def reminders(conn: sqlite3.Connection = Depends(get_db, scope="function")):
    return {"sent": billing.run_reminders(conn)}


@router.post("/payments/{payment_id}/{decision}")
def decide_payment(payment_id: str, decision: str, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Validation ou refus manuel d'un paiement mobile money en attente (decision : approve | decline)."""
    payment = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
    if not payment:
        raise not_found("PaymentNotFound", "Paiement introuvable.")
    if decision == "approve":
        billing.complete_payment(conn, payment)
    else:
        billing.mark_payment(conn, payment_id, "failed", "CustomerDeclined")
    payment = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
    return billing.payment_view(conn, payment)
