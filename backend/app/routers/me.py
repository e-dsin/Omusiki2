"""Compte de l'abonné : profil, suppression (RGPD), abonnement, historique des paiements."""
import sqlite3

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..billing import payment_view, subscription_view
from ..db import get_db, now
from ..errors import bad_request
from ..security import current_user, public_user

router = APIRouter(prefix="/api/me", tags=["Compte"])


class ProfileIn(BaseModel):
    name: str


def _me(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    return {"user": public_user(user), "subscription": subscription_view(conn, user["id"])}


@router.get("")
def get_me(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    return _me(conn, user)


@router.patch("")
def update_me(body: ProfileIn, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    name = body.name.strip()
    if not name:
        raise bad_request("InvalidParameterException", "Le nom est obligatoire.")
    conn.execute("UPDATE users SET name = ? WHERE id = ?", (name, user["id"]))
    updated = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    return _me(conn, updated)


@router.delete("")
def delete_me(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Suppression du compte et de toutes les données personnelles associées."""
    uid = user["id"]
    for table in ("favorites", "plays", "subscriptions", "checkout_sessions", "refresh_tokens"):
        conn.execute(f"DELETE FROM {table} WHERE user_id = ?", (uid,))
    conn.execute(
        "DELETE FROM playlist_tracks WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = ?)",
        (uid,),
    )
    conn.execute("DELETE FROM playlists WHERE user_id = ?", (uid,))
    # Les paiements sont conservés (obligation comptable) mais détachés du compte
    conn.execute(
        "UPDATE payments SET user_id = 'deleted', phone = NULL, updated_at = ? WHERE user_id = ?",
        (now(), uid),
    )
    conn.execute("DELETE FROM codes WHERE email = ?", (user["email"],))
    conn.execute("DELETE FROM users WHERE id = ?", (uid,))
    return {"deleted": True}


@router.get("/subscription")
def get_subscription(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    return subscription_view(conn, user["id"])


def _set_cancel(conn, user, value: int) -> dict:
    sub = conn.execute("SELECT * FROM subscriptions WHERE user_id = ?", (user["id"],)).fetchone()
    if not sub or sub["provider"] != "stripe" or sub["status"] != "active":
        raise bad_request("NoRenewingSubscription", "Aucun abonnement carte actif.")
    conn.execute(
        "UPDATE subscriptions SET cancel_at_period_end = ?, updated_at = ? WHERE user_id = ?",
        (value, now(), user["id"]),
    )
    return subscription_view(conn, user["id"])


@router.post("/subscription/cancel")
def cancel_subscription(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Résiliation : l'accès reste ouvert jusqu'à la fin de la période payée."""
    return _set_cancel(conn, user, 1)


@router.post("/subscription/resume")
def resume_subscription(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    return _set_cancel(conn, user, 0)


@router.get("/payments")
def list_payments(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    rows = conn.execute(
        "SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)
    ).fetchall()
    return [payment_view(conn, r) for r in rows]
