from datetime import datetime

from conftest import register


def _days_left(sub: dict) -> float:
    end = datetime.fromisoformat(sub["currentPeriodEnd"])
    return (end - datetime.now(end.tzinfo)).total_seconds() / 86400


def test_plans(client):
    plans = {p["id"]: p for p in client.get("/api/plans").json()}
    assert plans["premium_mensuel"]["provider"] == "stripe"
    assert plans["pass_30j"]["currency"] == "XAF" and plans["pass_90j"]["periodDays"] == 90


def test_stream_requires_subscription(client):
    h = register(client)["headers"]
    r = client.get("/api/tracks/cmr_hit_001/stream", headers=h)
    assert r.status_code == 403 and r.json()["error"] == "SubscriptionRequired"


def test_card_subscription_full_cycle(client):
    h = register(client)["headers"]
    session = client.post("/api/checkout/stripe", json={"planId": "premium_mensuel"}, headers=h).json()
    page = client.get(session["url"])
    assert page.status_code == 200 and "Simulation locale" in page.text
    # carte refusée : on reste sur la page de paiement, rien n'est activé
    r = client.post(f"{session['url']}/complete", data={"outcome": "declined"}, follow_redirects=False)
    assert r.status_code == 303 and "error=card_declined" in r.headers["location"]
    assert client.get("/api/me/subscription", headers=h).json()["hasAccess"] is False
    # paiement accepté -> retour vers le front, abonnement actif
    r = client.post(f"{session['url']}/complete", data={"outcome": "success"}, follow_redirects=False)
    assert r.headers["location"] == f"/paiement/retour?provider=stripe&session_id={session['sessionId']}"
    status = client.get(f"/api/checkout/stripe/{session['sessionId']}", headers=h).json()
    assert status["status"] == "complete" and status["payment"]["status"] == "succeeded"
    sub = status["subscription"]
    assert sub["hasAccess"] and sub["renews"] and 29 < _days_left(sub) <= 30
    assert client.get("/api/tracks/cmr_hit_001/stream", headers=h).status_code == 200
    # nouvel abonnement refusé tant que l'actuel renouvelle
    assert client.post("/api/checkout/stripe", json={"planId": "premium_mensuel"}, headers=h).status_code == 409
    # échéance dépassée sans résiliation -> renouvellement automatique + paiement
    client.post("/api/dev/users/awa@test.fr/subscription/expire")
    sub = client.get("/api/me/subscription", headers=h).json()
    assert sub["hasAccess"] and _days_left(sub) > 29
    reasons = [p["reason"] for p in client.get("/api/me/payments", headers=h).json()]
    assert reasons == ["renewal", "purchase"]
    # résiliation -> accès jusqu'à l'échéance, puis fermé
    assert client.post("/api/me/subscription/cancel", headers=h).json()["cancelAtPeriodEnd"] is True
    assert client.get("/api/me/subscription", headers=h).json()["hasAccess"] is True
    client.post("/api/dev/users/awa@test.fr/subscription/expire")
    sub = client.get("/api/me/subscription", headers=h).json()
    assert sub["status"] == "canceled" and sub["hasAccess"] is False


def test_checkout_cancel(client):
    h = register(client)["headers"]
    session = client.post("/api/checkout/stripe", json={"planId": "premium_mensuel"}, headers=h).json()
    r = client.post(f"{session['url']}/complete", data={"outcome": "cancel"}, follow_redirects=False)
    assert r.headers["location"].endswith("&status=cancel")
    assert client.get(f"/api/checkout/stripe/{session['sessionId']}", headers=h).json()["payment"]["status"] == "canceled"


def test_mobile_money_pass(client):
    h = register(client)["headers"]
    bad = client.post("/api/payments/aftawallet", json={"planId": "pass_30j", "phone": "12345", "operator": "MTN"}, headers=h)
    assert bad.status_code == 400 and bad.json()["error"] == "InvalidPhoneNumber"
    wrong_plan = client.post("/api/payments/aftawallet", json={"planId": "premium_mensuel", "phone": "690000001", "operator": "MTN"}, headers=h)
    assert wrong_plan.json()["error"] == "InvalidPlan"
    p = client.post("/api/payments/aftawallet", json={"planId": "pass_30j", "phone": "+237 6 90 12 34 56", "operator": "orange"}, headers=h).json()
    assert p["status"] == "pending" and p["currency"] == "XAF"
    done = client.get(f"/api/payments/{p['id']}", headers=h).json()  # délai de validation = 0 en test
    assert done["status"] == "succeeded" and done["subscription"]["kind"] == "pass"
    assert 29 < _days_left(done["subscription"]) <= 30 and done["subscription"]["renews"] is False
    # un second pass prolonge l'accès en cours
    p2 = client.post("/api/payments/aftawallet", json={"planId": "pass_90j", "phone": "690123456", "operator": "MTN"}, headers=h).json()
    sub = client.get(f"/api/payments/{p2['id']}", headers=h).json()["subscription"]
    assert 119 < _days_left(sub) <= 120
    # expiration -> plus d'accès
    client.post("/api/dev/users/awa@test.fr/subscription/expire")
    sub = client.get("/api/me/subscription", headers=h).json()
    assert sub["status"] == "expired" and sub["hasAccess"] is False


def test_mobile_money_declined_by_customer(client):
    h = register(client)["headers"]
    p = client.post("/api/payments/aftawallet", json={"planId": "pass_30j", "phone": "690000000", "operator": "MTN"}, headers=h).json()
    done = client.get(f"/api/payments/{p['id']}", headers=h).json()
    assert done["status"] == "failed" and done["failureReason"] == "CustomerDeclined"
    assert done["subscription"]["hasAccess"] is False


def test_webhooks_require_signature(client):
    h = register(client)["headers"]
    p = client.post("/api/payments/aftawallet", json={"planId": "pass_30j", "phone": "690123456", "operator": "MTN"}, headers=h).json()
    body = {"payment_id": p["id"], "status": "SUCCESSFUL"}
    assert client.post("/api/webhooks/aftawallet", json=body).status_code == 403
    assert client.post("/api/webhooks/aftawallet", json=body, headers={"X-Afta-Signature": "simulated"}).json() == {"received": True}
    assert client.post("/api/webhooks/stripe", json={"type": "x"}).status_code == 400


def test_reminder_two_days_before_end(client):
    h = register(client)["headers"]
    p = client.post("/api/payments/aftawallet", json={"planId": "pass_30j", "phone": "690123456", "operator": "MTN"}, headers=h).json()
    client.get(f"/api/payments/{p['id']}", headers=h)
    client.post("/api/dev/users/awa@test.fr/subscription/ends-in", json={"days": 1.5})
    assert client.post("/api/dev/reminders/run").json() == {"sent": 1}
    subjects = [m["subject"] for m in client.get("/api/dev/mailbox", params={"to": "awa@test.fr"}).json()]
    assert "Votre accès Ô musiki arrive à échéance" in subjects


def test_simulated_outage_and_latency(client):
    client.put("/api/dev/settings", json={"latencyMs": 0, "failRate": 1})
    r = client.get("/api/tracks")
    assert r.status_code == 503 and r.json()["error"] == "ServiceUnavailable"
    assert client.get("/api/dev/settings").status_code == 200  # les outils restent accessibles
    client.put("/api/dev/settings", json={"latencyMs": 0, "failRate": 0})
    assert client.get("/api/tracks").status_code == 200


def test_pass_refused_while_card_subscription_renews(client):
    """Pas de pass Mobile Money par-dessus un abonnement carte qui renouvelle (double prélèvement)."""
    h = register(client)["headers"]
    session = client.post("/api/checkout/stripe", json={"planId": "premium_mensuel"}, headers=h).json()
    client.post(f"{session['url']}/complete", data={"outcome": "success"})
    body = {"planId": "pass_30j", "phone": "690123456", "operator": "MTN"}
    r = client.post("/api/payments/aftawallet", json=body, headers=h)
    assert r.status_code == 409 and r.json()["error"] == "CardSubscriptionActive"
    # après résiliation, le pass est accepté
    client.post("/api/me/subscription/cancel", headers=h)
    assert client.post("/api/payments/aftawallet", json=body, headers=h).status_code == 201
