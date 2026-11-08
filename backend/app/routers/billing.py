"""Formules et paiements simulés : carte (contrat Stripe Checkout) et mobile money (contrat Aftawallet)."""
import html
import re
import sqlite3

from fastapi import APIRouter, Depends, Form, Header
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

from .. import billing
from ..billing import PLANS, get_plan, payment_view, subscription_view
from ..db import get_db, new_id, now
from ..errors import bad_request, conflict, forbidden, not_found
from ..security import current_user

router = APIRouter(tags=["Paiements"])

SIM_SIGNATURE = "simulated"  # signature attendue des webhooks simulés


class CheckoutIn(BaseModel):
    planId: str


class AftaIn(BaseModel):
    planId: str
    phone: str
    operator: str


@router.get("/api/plans")
def list_plans():
    return PLANS


# --------------------------------------------------------------------------- Carte (Stripe)
def _create_payment(conn, user_id: str, plan: dict, provider: str, phone=None, operator=None) -> str:
    pid = new_id("pay")
    t = now()
    conn.execute(
        "INSERT INTO payments (id, user_id, plan_id, provider, amount, currency, status, phone, operator, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)",
        (pid, user_id, plan["id"], provider, plan["price"], plan["currency"], phone, operator, t, t),
    )
    return pid


@router.post("/api/checkout/stripe")
def create_checkout(body: CheckoutIn, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    plan = get_plan(body.planId)
    if plan["provider"] != "stripe":
        raise bad_request("InvalidPlan", "Cette formule se paie par Mobile Money.")
    sub = subscription_view(conn, user["id"])
    if sub["hasAccess"] and sub.get("provider") == "stripe" and not sub.get("cancelAtPeriodEnd"):
        raise conflict("AlreadySubscribed", "Vous avez déjà un abonnement carte actif.")
    payment_id = _create_payment(conn, user["id"], plan, "stripe")
    session_id = new_id("cs_test")
    conn.execute(
        "INSERT INTO checkout_sessions (id, user_id, plan_id, payment_id, status, created_at)"
        " VALUES (?, ?, ?, ?, 'open', ?)",
        (session_id, user["id"], plan["id"], payment_id, now()),
    )
    # Équivalent de session.url chez Stripe : page de paiement hébergée (ici simulée)
    return {"sessionId": session_id, "url": f"/api/sim/stripe/checkout/{session_id}"}


@router.get("/api/checkout/stripe/{session_id}")
def get_checkout(session_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    session = conn.execute(
        "SELECT * FROM checkout_sessions WHERE id = ? AND user_id = ?", (session_id, user["id"])
    ).fetchone()
    if not session:
        raise not_found("SessionNotFound", "Session de paiement introuvable.")
    payment = conn.execute("SELECT * FROM payments WHERE id = ?", (session["payment_id"],)).fetchone()
    return {
        "sessionId": session_id,
        "status": session["status"],
        "payment": payment_view(conn, payment),
        "subscription": subscription_view(conn, user["id"]),
    }


SIM_PAGE = """<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Paiement par carte — simulation locale</title>
<style>
 body{{margin:0;font-family:system-ui,Segoe UI,Arial,sans-serif;background:#f4f4f7;color:#1c1730;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}}
 .card{{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);max-width:420px;width:100%;padding:28px}}
 .badge{{display:inline-block;font-size:12px;font-weight:600;color:#7a2e9e;background:#efe7f6;border-radius:999px;padding:4px 10px;margin-bottom:12px}}
 h1{{font-size:20px;margin:0 0 4px}} .amount{{font-size:28px;font-weight:700;margin:12px 0 4px}}
 p{{color:#655f78;font-size:14px;line-height:1.5}} .err{{background:#fdecec;color:#9b1c1c;padding:10px 12px;border-radius:8px;font-size:14px}}
 button{{width:100%;padding:12px;border-radius:8px;border:0;font-size:15px;font-weight:600;cursor:pointer;margin-top:10px}}
 .pay{{background:#1c1730;color:#fff}} .decline{{background:#fff;color:#9b1c1c;border:1px solid #e7b3b3}} .cancel{{background:transparent;color:#655f78}}
</style></head><body><div class="card">
<span class="badge">Simulation locale — aucun paiement réel</span>
<h1>{plan_name}</h1><div class="amount">{amount}</div>
<p>{description}</p>{error}
<form method="post" action="/api/sim/stripe/checkout/{session_id}/complete">
 <button class="pay" name="outcome" value="success">Payer (paiement accepté)</button>
 <button class="decline" name="outcome" value="declined">Simuler une carte refusée</button>
 <button class="cancel" name="outcome" value="cancel">Annuler et revenir à Ô musiki</button>
</form></div></body></html>"""


def _fmt_amount(plan: dict) -> str:
    if plan["currency"] == "EUR":
        return f"{plan['price']:.2f} € / mois".replace(".", ",")
    return f"{int(plan['price']):,} FCFA".replace(",", " ")


@router.get("/api/sim/stripe/checkout/{session_id}", response_class=HTMLResponse, include_in_schema=False)
def sim_checkout_page(session_id: str, error: str = "", conn: sqlite3.Connection = Depends(get_db, scope="function")):
    session = conn.execute("SELECT * FROM checkout_sessions WHERE id = ?", (session_id,)).fetchone()
    if not session or session["status"] != "open":
        return RedirectResponse(f"/paiement/retour?provider=stripe&session_id={session_id}", status_code=303)
    plan = get_plan(session["plan_id"])
    error_html = (
        '<p class="err">Votre carte a été refusée. Essayez un autre moyen de paiement.</p>' if error else ""
    )
    return SIM_PAGE.format(
        plan_name=html.escape(plan["name"]),
        amount=html.escape(_fmt_amount(plan)),
        description=html.escape(plan["description"]),
        error=error_html,
        session_id=html.escape(session_id),
    )


def handle_stripe_event(conn: sqlite3.Connection, event: dict) -> None:
    """Traitement des événements Stripe (appelé par le webhook et par la page simulée)."""
    if event.get("type") == "checkout.session.completed":
        session_id = event["data"]["object"]["id"]
        session = conn.execute("SELECT * FROM checkout_sessions WHERE id = ?", (session_id,)).fetchone()
        if not session:
            raise not_found("SessionNotFound", "Session inconnue.")
        conn.execute("UPDATE checkout_sessions SET status = 'complete' WHERE id = ?", (session_id,))
        payment = conn.execute("SELECT * FROM payments WHERE id = ?", (session["payment_id"],)).fetchone()
        billing.complete_payment(conn, payment)


@router.post("/api/sim/stripe/checkout/{session_id}/complete", include_in_schema=False)
def sim_checkout_complete(session_id: str, outcome: str = Form(...), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    session = conn.execute("SELECT * FROM checkout_sessions WHERE id = ?", (session_id,)).fetchone()
    if not session:
        raise not_found("SessionNotFound", "Session inconnue.")
    back = f"/paiement/retour?provider=stripe&session_id={session_id}"
    if session["status"] != "open":
        return RedirectResponse(back, status_code=303)
    if outcome == "success":
        handle_stripe_event(conn, {"type": "checkout.session.completed", "data": {"object": {"id": session_id}}})
        return RedirectResponse(back, status_code=303)
    if outcome == "declined":
        # Le paiement reste en attente : nouvelle tentative possible sur la même session, comme chez Stripe
        conn.execute(
            "UPDATE payments SET failure_reason = 'card_declined', updated_at = ? WHERE id = ?",
            (now(), session["payment_id"]),
        )
        return RedirectResponse(f"/api/sim/stripe/checkout/{session_id}?error=card_declined", status_code=303)
    conn.execute("UPDATE checkout_sessions SET status = 'expired' WHERE id = ?", (session_id,))
    billing.mark_payment(conn, session["payment_id"], "canceled")
    return RedirectResponse(back + "&status=cancel", status_code=303)


@router.post("/api/webhooks/stripe", tags=["Webhooks"])
def stripe_webhook(
    event: dict,
    stripe_signature: str | None = Header(default=None),
    conn: sqlite3.Connection = Depends(get_db, scope="function"),
):
    if stripe_signature != SIM_SIGNATURE:
        raise bad_request("InvalidSignature", "Signature de webhook invalide.")
    handle_stripe_event(conn, event)
    return {"received": True}


# --------------------------------------------------------------------- Mobile money (Aftawallet)
PHONE_RE = re.compile(r"^(?:237)?(6\d{8})$")


@router.post("/api/payments/aftawallet", status_code=201)
def create_afta_payment(body: AftaIn, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    plan = get_plan(body.planId)
    if plan["provider"] != "aftawallet":
        raise bad_request("InvalidPlan", "Cette formule se paie par carte.")
    sub = subscription_view(conn, user["id"])
    if sub["hasAccess"] and sub.get("renews"):
        # Évite un double prélèvement : le pass remplacerait un abonnement carte toujours facturé
        raise conflict(
            "CardSubscriptionActive",
            "Votre abonnement carte est actif : résiliez-le avant de passer à un pass Mobile Money.",
        )
    operator = body.operator.upper()
    if operator not in ("MTN", "ORANGE"):
        raise bad_request("InvalidOperator", "Opérateur non pris en charge.")
    digits = re.sub(r"\D", "", body.phone)
    match = PHONE_RE.match(digits)
    if not match:
        raise bad_request("InvalidPhoneNumber", "Numéro de téléphone camerounais invalide (9 chiffres, commençant par 6).")
    phone = f"237{match.group(1)}"
    payment_id = _create_payment(conn, user["id"], plan, "aftawallet", phone, operator)
    payment = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
    return {
        **payment_view(conn, payment),
        "message": "Validez le paiement sur votre téléphone (notification de votre opérateur).",
    }


@router.get("/api/payments/{payment_id}")
def get_payment(payment_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    payment = conn.execute(
        "SELECT * FROM payments WHERE id = ? AND user_id = ?", (payment_id, user["id"])
    ).fetchone()
    if not payment:
        raise not_found("PaymentNotFound", "Paiement introuvable.")
    payment = billing.finalize_aftawallet_if_due(conn, payment)
    return {**payment_view(conn, payment), "subscription": subscription_view(conn, user["id"])}


class AftaWebhookIn(BaseModel):
    payment_id: str
    status: str  # SUCCESSFUL | FAILED


@router.post("/api/webhooks/aftawallet", tags=["Webhooks"])
def afta_webhook(
    body: AftaWebhookIn,
    x_afta_signature: str | None = Header(default=None),
    conn: sqlite3.Connection = Depends(get_db, scope="function"),
):
    """Équivalent du callback_url Aftawallet (statut final de la transaction)."""
    if x_afta_signature != SIM_SIGNATURE:
        raise forbidden("InvalidSignature", "Signature de webhook invalide.")
    payment = conn.execute("SELECT * FROM payments WHERE id = ?", (body.payment_id,)).fetchone()
    if not payment:
        raise not_found("PaymentNotFound", "Paiement introuvable.")
    if body.status.upper() == "SUCCESSFUL":
        billing.complete_payment(conn, payment)
    elif payment["status"] == "pending":
        billing.mark_payment(conn, payment["id"], "failed", "ProviderFailed")
    return {"received": True}
