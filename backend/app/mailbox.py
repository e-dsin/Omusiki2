"""Boîte mail simulée : remplace l'envoi réel (Cognito / SES / Brevo).

Chaque message est enregistré en base (consultable via GET /api/dev/mailbox)
et affiché dans la console du back-end.
"""
import logging
import sqlite3

from .db import now

log = logging.getLogger("omusiki.mailbox")


def send_mail(
    conn: sqlite3.Connection, to_email: str, subject: str, body: str, code: str | None = None
) -> None:
    conn.execute(
        "INSERT INTO mailbox (to_email, subject, body, code, created_at) VALUES (?, ?, ?, ?, ?)",
        (to_email, subject, body, code, now()),
    )
    suffix = f"  [code : {code}]" if code else ""
    log.warning("📧 %s -> %s%s", subject, to_email, suffix)
