"""Authentification simulée (contrat calqué sur Amazon Cognito)."""
import sqlite3

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from .. import config
from ..db import get_db, new_id, now
from ..errors import ApiError, bad_request, unauthorized
from ..mailbox import send_mail
from ..security import (
    check_password_policy,
    hash_password,
    issue_tokens,
    new_code,
    normalize_email,
    public_user,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Authentification"])


class SignUpIn(BaseModel):
    email: str
    password: str
    name: str


class ConfirmIn(BaseModel):
    email: str
    code: str


class EmailIn(BaseModel):
    email: str


class LoginIn(BaseModel):
    email: str
    password: str


class RefreshIn(BaseModel):
    refreshToken: str


class ResetIn(BaseModel):
    email: str
    code: str
    newPassword: str


def _store_code(conn: sqlite3.Connection, email: str, purpose: str, ttl: int) -> str:
    code = new_code()
    conn.execute(
        "INSERT INTO codes (email, purpose, code, expires_at, attempts) VALUES (?, ?, ?, ?, 0)"
        " ON CONFLICT(email, purpose) DO UPDATE SET code = excluded.code,"
        " expires_at = excluded.expires_at, attempts = 0",
        (email, purpose, code, now() + ttl),
    )
    return code


def _check_code(conn: sqlite3.Connection, email: str, purpose: str, code: str) -> None:
    row = conn.execute(
        "SELECT * FROM codes WHERE email = ? AND purpose = ?", (email, purpose)
    ).fetchone()
    if not row:
        raise bad_request("CodeMismatchException", "Code incorrect.")
    if row["attempts"] >= config.MAX_CODE_ATTEMPTS:
        raise ApiError(429, "LimitExceededException", "Trop de tentatives.")
    if row["expires_at"] < now():
        raise bad_request("ExpiredCodeException", "Code expiré.")
    if row["code"] != (code or "").strip():
        conn.execute(
            "UPDATE codes SET attempts = attempts + 1 WHERE email = ? AND purpose = ?",
            (email, purpose),
        )
        conn.commit()  # conserver le compteur malgré l'erreur renvoyée
        raise bad_request("CodeMismatchException", "Code incorrect.")
    conn.execute("DELETE FROM codes WHERE email = ? AND purpose = ?", (email, purpose))


def _session(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    return {"user": public_user(user), **issue_tokens(conn, user)}


@router.post("/signup")
def signup(body: SignUpIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    email = normalize_email(body.email)
    if not body.name.strip():
        raise bad_request("InvalidParameterException", "Le nom est obligatoire.")
    check_password_policy(body.password)
    existing = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if existing and existing["confirmed"]:
        raise ApiError(409, "UsernameExistsException", "Un compte existe déjà avec cet email.")
    if existing:  # inscription non confirmée : on la remplace
        conn.execute("DELETE FROM users WHERE id = ?", (existing["id"],))
    conn.execute(
        "INSERT INTO users (id, email, name, password_hash, provider, confirmed, created_at)"
        " VALUES (?, ?, ?, ?, 'password', 0, ?)",
        (new_id("usr"), email, body.name.strip(), hash_password(body.password), now()),
    )
    code = _store_code(conn, email, "signup", config.SIGNUP_CODE_TTL_SECONDS)
    send_mail(conn, email, "Votre code de confirmation Ô musiki", f"Votre code : {code}", code)
    return {"status": "confirm", "email": email}


@router.post("/confirm")
def confirm(body: ConfirmIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    email = normalize_email(body.email)
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        raise bad_request("CodeMismatchException", "Code incorrect.")
    _check_code(conn, email, "signup", body.code)
    conn.execute("UPDATE users SET confirmed = 1 WHERE id = ?", (user["id"],))
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    send_mail(conn, email, "Bienvenue sur Ô musiki", f"Bonjour {user['name']}, votre compte est actif.")
    return {"status": "signed-in", **_session(conn, user)}


@router.post("/resend-code")
def resend_code(body: EmailIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    email = normalize_email(body.email)
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if user and not user["confirmed"]:
        code = _store_code(conn, email, "signup", config.SIGNUP_CODE_TTL_SECONDS)
        send_mail(conn, email, "Votre code de confirmation Ô musiki", f"Votre code : {code}", code)
    return {"sent": True}


@router.post("/login")
def login(body: LoginIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    email = (body.email or "").strip().lower()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    # Même erreur pour « inconnu » et « mauvais mot de passe » (pas d'énumération des comptes)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise unauthorized("NotAuthorizedException", "Email ou mot de passe incorrect.")
    if not user["confirmed"]:
        raise ApiError(403, "UserNotConfirmedException", "Compte non confirmé.")
    return _session(conn, user)


@router.post("/refresh")
def refresh(body: RefreshIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    row = conn.execute(
        "SELECT * FROM refresh_tokens WHERE token = ?", (body.refreshToken,)
    ).fetchone()
    if not row or row["revoked"] or row["expires_at"] < now():
        raise unauthorized("NotAuthorizedException", "Session expirée, reconnectez-vous.")
    user = conn.execute("SELECT * FROM users WHERE id = ?", (row["user_id"],)).fetchone()
    if not user:
        raise unauthorized("NotAuthorizedException", "Compte introuvable.")
    conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?", (body.refreshToken,))
    return _session(conn, user)


@router.post("/logout")
def logout(body: RefreshIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?", (body.refreshToken,))
    return {"ok": True}


@router.post("/forgot")
def forgot(body: EmailIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    email = normalize_email(body.email)
    user = conn.execute(
        "SELECT * FROM users WHERE email = ? AND provider = 'password'", (email,)
    ).fetchone()
    if user:  # réponse identique dans tous les cas (pas d'énumération des comptes)
        code = _store_code(conn, email, "reset", config.RESET_CODE_TTL_SECONDS)
        send_mail(conn, email, "Réinitialisation de votre mot de passe Ô musiki", f"Votre code : {code}", code)
    local, _, domain = email.partition("@")
    return {"status": "code-sent", "destination": f"{local[:1]}***@{domain}"}


@router.post("/reset")
def reset(body: ResetIn, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    email = normalize_email(body.email)
    check_password_policy(body.newPassword)
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        raise bad_request("CodeMismatchException", "Code incorrect.")
    _check_code(conn, email, "reset", body.code)
    conn.execute(
        "UPDATE users SET password_hash = ?, confirmed = 1 WHERE id = ?",
        (hash_password(body.newPassword), user["id"]),
    )
    conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (user["id"],))
    send_mail(conn, email, "Votre mot de passe Ô musiki a été modifié", "Si vous n'êtes pas à l'origine de ce changement, contactez le support.")
    return {"status": "done"}


@router.post("/oauth/{provider}")
def oauth(provider: str, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Simule le retour de la connexion fédérée Google / Apple (Cognito Hosted UI)."""
    provider = provider.lower()
    if provider not in ("google", "apple"):
        raise bad_request("InvalidParameterException", "Fournisseur inconnu.")
    email = f"demo.{provider}@omusiki.test"
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, provider, confirmed, created_at)"
            " VALUES (?, ?, ?, NULL, ?, 1, ?)",
            (new_id("usr"), email, f"Utilisateur {provider.capitalize()}", provider, now()),
        )
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    return _session(conn, user)
