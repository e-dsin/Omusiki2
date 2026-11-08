"""Paramètres du back-end simulé, surchargeables par variables d'environnement."""
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


# Base SQLite locale (fichier unique, réinitialisable)
DB_PATH = Path(os.environ.get("OMUSIKI_DB", BACKEND_DIR / "data" / "omusiki.db"))

# Catalogue : lu directement dans le fichier du front pour garder les mêmes données
CATALOG_JS = Path(
    os.environ.get("OMUSIKI_CATALOG_JS", REPO_DIR / "src" / "services" / "musicDatabase.js")
)
CATALOG_FALLBACK = BACKEND_DIR / "app" / "seed" / "catalog_fallback.json"

# Jetons (format proche de Cognito). Secret de développement : NE PAS utiliser en production.
JWT_SECRET = os.environ.get("OMUSIKI_JWT_SECRET", "dev-only-secret-ne-pas-utiliser-en-production")
ACCESS_TTL_SECONDS = _int("OMUSIKI_ACCESS_TTL", 15 * 60)
REFRESH_TTL_SECONDS = _int("OMUSIKI_REFRESH_TTL", 30 * 24 * 3600)

# Codes à 6 chiffres (inscription : 24 h, réinitialisation : 1 h, comme Cognito)
SIGNUP_CODE_TTL_SECONDS = 24 * 3600
RESET_CODE_TTL_SECONDS = 3600
MAX_CODE_ATTEMPTS = 5

# Aftawallet simulé : délai avant « validation sur le téléphone » du client
AFTA_CONFIRM_DELAY_SECONDS = _int("OMUSIKI_AFTA_DELAY", 6)

# Rappel avant échéance (J-2)
REMINDER_DAYS = 2

# Endpoints /api/dev (boîte mail, réinitialisation, pannes simulées…)
DEV_TOOLS = os.environ.get("OMUSIKI_DEV", "1") != "0"

# Origines autorisées (appel direct sans passer par le proxy Vite)
CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "OMUSIKI_CORS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]
