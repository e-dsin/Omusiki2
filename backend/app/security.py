"""Mots de passe (bcrypt), jetons JWT au format proche de Cognito, utilisateur courant."""
import re
import secrets
import sqlite3

import bcrypt
import jwt
from fastapi import Depends, Header

from . import config
from .db import get_db, now
from .errors import bad_request, unauthorized

# Doit correspondre à PASSWORD_RULES côté front (src/services/authErrors.js)
# et à la politique du User Pool Cognito en production.
PASSWORD_RULES = [
    (lambda pw: len(pw) >= 8, "8 caractères minimum"),
    (lambda pw: re.search(r"[A-Z]", pw), "une majuscule"),
    (lambda pw: re.search(r"[a-z]", pw), "une minuscule"),
    (lambda pw: re.search(r"\d", pw), "un chiffre"),
    (lambda pw: len(pw.encode("utf-8")) <= 72, "72 octets maximum"),  # limite bcrypt
]

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")


def check_password_policy(password: str) -> None:
    issues = [label for rule, label in PASSWORD_RULES if not rule(password)]
    if issues:
        raise bad_request(
            "InvalidPasswordException",
            "Le mot de passe doit contenir : " + ", ".join(issues) + ".",
        )


def normalize_email(email: str) -> str:
    email = (email or "").strip().lower()
    if not EMAIL_RE.match(email):
        raise bad_request("InvalidParameterException", "Adresse email invalide.")
    return email


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False


def new_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def issue_tokens(conn: sqlite3.Connection, user: sqlite3.Row) -> dict:
    issued = now()
    access = jwt.encode(
        {
            "sub": user["id"],
            "email": user["email"],
            "token_use": "access",
            "iat": int(issued),
            "exp": int(issued + config.ACCESS_TTL_SECONDS),
        },
        config.JWT_SECRET,
        algorithm="HS256",
    )
    refresh = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
        (refresh, user["id"], issued + config.REFRESH_TTL_SECONDS),
    )
    return {
        "accessToken": access,
        "refreshToken": refresh,
        "expiresIn": config.ACCESS_TTL_SECONDS,
    }


def _decode(token: str) -> dict:
    try:
        claims = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise unauthorized("TokenExpired", "Session expirée.") from exc
    except jwt.InvalidTokenError as exc:
        raise unauthorized("InvalidToken", "Jeton invalide.") from exc
    if claims.get("token_use") != "access":
        raise unauthorized("InvalidToken", "Jeton invalide.")
    return claims


def current_user(
    authorization: str | None = Header(default=None),
    conn: sqlite3.Connection = Depends(get_db, scope="function"),
) -> sqlite3.Row:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise unauthorized("NotAuthenticated", "Authentification requise.")
    claims = _decode(authorization.split(" ", 1)[1].strip())
    user = conn.execute("SELECT * FROM users WHERE id = ?", (claims["sub"],)).fetchone()
    if not user:
        raise unauthorized("NotAuthenticated", "Compte introuvable.")
    return user


def public_user(user: sqlite3.Row) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "provider": user["provider"],
    }
