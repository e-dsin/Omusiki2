from conftest import PASSWORD, last_code, register


def test_catalog_is_read_from_frontend_file(client):
    r = client.get("/api/health")
    assert r.json()["tracks"] == 14
    track = client.get("/api/tracks/cmr_makossa_001").json()
    assert "l'énergie" in track["description"]  # chaîne entre guillemets doubles avec apostrophe


def test_signup_requires_confirmation_code(client):
    r = client.post("/api/auth/signup", json={"email": "Awa@Test.fr", "password": PASSWORD, "name": "Awa"})
    assert r.json() == {"status": "confirm", "email": "awa@test.fr"}
    # tant que le compte n'est pas confirmé, la connexion est refusée
    r = client.post("/api/auth/login", json={"email": "awa@test.fr", "password": PASSWORD})
    assert r.status_code == 403 and r.json()["error"] == "UserNotConfirmedException"
    # mauvais code
    r = client.post("/api/auth/confirm", json={"email": "awa@test.fr", "code": "000000"})
    assert r.json()["error"] == "CodeMismatchException"
    # bon code -> session
    r = client.post("/api/auth/confirm", json={"email": "awa@test.fr", "code": last_code(client, "awa@test.fr")})
    body = r.json()
    assert body["status"] == "signed-in" and body["user"]["email"] == "awa@test.fr" and body["accessToken"]


def test_password_policy_and_duplicates(client):
    r = client.post("/api/auth/signup", json={"email": "a@test.fr", "password": "faible", "name": "A"})
    assert r.status_code == 400 and r.json()["error"] == "InvalidPasswordException"
    register(client, "a@test.fr")
    r = client.post("/api/auth/signup", json={"email": "a@test.fr", "password": PASSWORD, "name": "A"})
    assert r.status_code == 409 and r.json()["error"] == "UsernameExistsException"


def test_login_errors_do_not_reveal_accounts(client):
    register(client)
    wrong = client.post("/api/auth/login", json={"email": "awa@test.fr", "password": "Mauvais123"})
    unknown = client.post("/api/auth/login", json={"email": "inconnu@test.fr", "password": PASSWORD})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json()["error"] == unknown.json()["error"] == "NotAuthorizedException"


def test_code_attempts_are_limited(client):
    client.post("/api/auth/signup", json={"email": "b@test.fr", "password": PASSWORD, "name": "B"})
    for _ in range(5):
        client.post("/api/auth/confirm", json={"email": "b@test.fr", "code": "999999"})
    r = client.post("/api/auth/confirm", json={"email": "b@test.fr", "code": last_code(client, "b@test.fr")})
    assert r.status_code == 429 and r.json()["error"] == "LimitExceededException"


def test_me_requires_valid_token_and_refresh_rotates(client):
    assert client.get("/api/me").json()["error"] == "NotAuthenticated"
    assert client.get("/api/me", headers={"Authorization": "Bearer xxx"}).json()["error"] == "InvalidToken"
    auth = register(client)
    me = client.get("/api/me", headers=auth["headers"]).json()
    assert me["user"]["name"] == "Awa" and me["subscription"] == {"status": "none", "hasAccess": False}
    old = auth["session"]["refreshToken"]
    r = client.post("/api/auth/refresh", json={"refreshToken": old})
    assert r.status_code == 200 and r.json()["refreshToken"] != old
    # un refresh token ne sert qu'une fois
    assert client.post("/api/auth/refresh", json={"refreshToken": old}).status_code == 401


def test_forgot_and_reset_password(client):
    register(client)
    r = client.post("/api/auth/forgot", json={"email": "awa@test.fr"})
    assert r.json() == {"status": "code-sent", "destination": "a***@test.fr"}
    # même réponse pour un email inconnu
    assert client.post("/api/auth/forgot", json={"email": "x@test.fr"}).json()["status"] == "code-sent"
    code = last_code(client, "awa@test.fr")
    r = client.post("/api/auth/reset", json={"email": "awa@test.fr", "code": code, "newPassword": "Nouveau123"})
    assert r.json() == {"status": "done"}
    assert client.post("/api/auth/login", json={"email": "awa@test.fr", "password": PASSWORD}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "awa@test.fr", "password": "Nouveau123"}).status_code == 200


def test_oauth_and_profile_and_delete(client):
    r = client.post("/api/auth/oauth/google")
    headers = {"Authorization": f"Bearer {r.json()['accessToken']}"}
    assert r.json()["user"]["provider"] == "google"
    r = client.patch("/api/me", json={"name": "Awa Mbappe"}, headers=headers)
    assert r.json()["user"]["name"] == "Awa Mbappe"
    client.put("/api/me/favorites/cmr_makossa_001", headers=headers)
    assert client.delete("/api/me", headers=headers).json() == {"deleted": True}
    assert client.get("/api/me", headers=headers).status_code == 401
