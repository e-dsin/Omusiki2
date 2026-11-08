from conftest import register


def test_search_and_collections(client):
    assert {t["id"] for t in client.get("/api/tracks", params={"q": "makossa"}).json()} == {
        "cmr_makossa_001",
        "cmr_makossa_002",
    }
    assert len(client.get("/api/tracks", params={"country": "Nigeria"}).json()) == 2
    home = client.get("/api/collections/home").json()
    assert {c["id"] for c in home["topChartsData"]} >= {"chart_cameroon", "chart_world_music"}
    chart = client.get("/api/collections/chart_cameroon").json()
    assert chart["tracks"] == 4 and chart["type"] == "chart"
    assert client.get("/api/collections/inconnue").status_code == 404


def test_favorites_follow_the_account(client):
    auth = register(client)
    h = auth["headers"]
    client.put("/api/me/favorites/cmr_makossa_001", headers=h)
    client.put("/api/me/favorites/nga_afrobeats_001", headers=h)
    client.put("/api/me/favorites/nga_afrobeats_001", headers=h)  # idempotent
    favs = client.get("/api/me/favorites", headers=h).json()
    assert [f["id"] for f in favs] == ["nga_afrobeats_001", "cmr_makossa_001"] and favs[0]["addedAt"]
    client.delete("/api/me/favorites/cmr_makossa_001", headers=h)
    assert len(client.get("/api/me/favorites", headers=h).json()) == 1
    assert client.put("/api/me/favorites/inconnu", headers=h).status_code == 404


def test_playlists_crud(client):
    h = register(client)["headers"]
    pl = client.post("/api/me/playlists", json={"name": "Soirée"}, headers=h).json()
    client.put(f"/api/me/playlists/{pl['id']}/tracks/cmr_makossa_001", headers=h)
    pl = client.put(f"/api/me/playlists/{pl['id']}/tracks/saf_001", headers=h).json()
    assert [s["id"] for s in pl["songs"]] == ["cmr_makossa_001", "saf_001"]
    pl = client.patch(f"/api/me/playlists/{pl['id']}", json={"name": "Soirée makossa"}, headers=h).json()
    assert pl["name"] == "Soirée makossa"
    pl = client.delete(f"/api/me/playlists/{pl['id']}/tracks/cmr_makossa_001", headers=h).json()
    assert [s["id"] for s in pl["songs"]] == ["saf_001"]
    # une autre personne ne voit pas cette playlist
    other = register(client, "bob@test.fr", "Bob")["headers"]
    assert client.get(f"/api/me/playlists/{pl['id']}", headers=other).status_code == 404
    client.delete(f"/api/me/playlists/{pl['id']}", headers=h)
    assert client.get("/api/me/playlists", headers=h).json() == []


def test_play_log_counts_from_30_seconds(client):
    h = register(client)["headers"]
    assert client.post("/api/plays", json={"trackId": "cmr_hit_001", "seconds": 12}, headers=h).json()["counted"] is False
    assert client.post("/api/plays", json={"trackId": "cmr_hit_001", "seconds": 45}, headers=h).json()["counted"] is True
    assert client.get("/api/tracks/cmr_hit_001").json()["platformPlays"] == 1
    assert client.get("/api/me/plays", headers=h).json()[0]["track"]["id"] == "cmr_hit_001"
