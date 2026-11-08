"""Configuration des tests : base temporaire, catalogue d'exemple, validation mobile money immédiate."""
import os
import sys
import tempfile
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
_TMP = tempfile.mkdtemp(prefix="omusiki-tests-")
os.environ["OMUSIKI_DB"] = str(Path(_TMP) / "test.db")
os.environ["OMUSIKI_CATALOG_JS"] = str(HERE / "fixtures" / "musicDatabase_sample.js")
os.environ["OMUSIKI_AFTA_DELAY"] = "0"
os.environ["OMUSIKI_DEV"] = "1"
sys.path.insert(0, str(HERE.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

PASSWORD = "Secret123"


@pytest.fixture()
def client():
    with TestClient(app) as c:
        c.post("/api/dev/reset")
        yield c


def last_code(client, email: str) -> str:
    mails = client.get("/api/dev/mailbox", params={"to": email}).json()
    return next(m["code"] for m in mails if m["code"])


def register(client, email: str = "awa@test.fr", name: str = "Awa") -> dict:
    """Inscription + confirmation ; renvoie les en-têtes d'authentification et la session."""
    r = client.post("/api/auth/signup", json={"email": email, "password": PASSWORD, "name": name})
    assert r.status_code == 200, r.text
    r = client.post("/api/auth/confirm", json={"email": email, "code": last_code(client, email)})
    assert r.status_code == 200, r.text
    session = r.json()
    return {"headers": {"Authorization": f"Bearer {session['accessToken']}"}, "session": session}
