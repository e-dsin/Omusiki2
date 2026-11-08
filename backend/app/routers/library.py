"""Bibliothèque de l'abonné : favoris, playlists, journal d'écoutes."""
import sqlite3

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .. import catalog
from ..billing import iso
from ..db import get_db, new_id, now
from ..errors import bad_request, not_found
from ..security import current_user

router = APIRouter(prefix="/api", tags=["Bibliothèque"])


class PlaylistIn(BaseModel):
    name: str


class PlayIn(BaseModel):
    trackId: str
    seconds: int = Field(ge=0, le=24 * 3600)


def _track_or_404(track_id: str) -> dict:
    track = catalog.get_track(track_id)
    if not track:
        raise not_found("TrackNotFound", "Titre introuvable.")
    return track


# --- Favoris ---
@router.get("/me/favorites")
def list_favorites(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    rows = conn.execute(
        "SELECT track_id, added_at FROM favorites WHERE user_id = ? ORDER BY added_at DESC",
        (user["id"],),
    ).fetchall()
    index = catalog.track_index()
    return [
        {**index[r["track_id"]], "addedAt": iso(r["added_at"]), "addedTimestamp": int(r["added_at"] * 1000)}
        for r in rows
        if r["track_id"] in index
    ]


@router.put("/me/favorites/{track_id}")
def add_favorite(track_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    _track_or_404(track_id)
    conn.execute(
        "INSERT OR IGNORE INTO favorites (user_id, track_id, added_at) VALUES (?, ?, ?)",
        (user["id"], track_id, now()),
    )
    return {"trackId": track_id, "favorite": True}


@router.delete("/me/favorites/{track_id}")
def remove_favorite(track_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    conn.execute("DELETE FROM favorites WHERE user_id = ? AND track_id = ?", (user["id"], track_id))
    return {"trackId": track_id, "favorite": False}


# --- Playlists ---
def _playlist(conn, user, playlist_id: str) -> sqlite3.Row:
    row = conn.execute(
        "SELECT * FROM playlists WHERE id = ? AND user_id = ?", (playlist_id, user["id"])
    ).fetchone()
    if not row:
        raise not_found("PlaylistNotFound", "Playlist introuvable.")
    return row


def _playlist_view(conn, row: sqlite3.Row) -> dict:
    index = catalog.track_index()
    ids = [
        r["track_id"]
        for r in conn.execute(
            "SELECT track_id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position", (row["id"],)
        )
    ]
    return {
        "id": row["id"],
        "name": row["name"],
        "createdAt": iso(row["created_at"]),
        "songs": [index[i] for i in ids if i in index],
    }


@router.get("/me/playlists")
def list_playlists(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    rows = conn.execute(
        "SELECT * FROM playlists WHERE user_id = ? ORDER BY created_at", (user["id"],)
    ).fetchall()
    return [_playlist_view(conn, r) for r in rows]


@router.post("/me/playlists", status_code=201)
def create_playlist(body: PlaylistIn, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    name = body.name.strip()
    if not name:
        raise bad_request("InvalidParameterException", "Le nom de la playlist est obligatoire.")
    pid = new_id("pl")
    conn.execute(
        "INSERT INTO playlists (id, user_id, name, created_at) VALUES (?, ?, ?, ?)",
        (pid, user["id"], name, now()),
    )
    return _playlist_view(conn, _playlist(conn, user, pid))


@router.get("/me/playlists/{playlist_id}")
def get_playlist(playlist_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    return _playlist_view(conn, _playlist(conn, user, playlist_id))


@router.patch("/me/playlists/{playlist_id}")
def rename_playlist(
    playlist_id: str, body: PlaylistIn, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")
):
    _playlist(conn, user, playlist_id)
    if not body.name.strip():
        raise bad_request("InvalidParameterException", "Le nom de la playlist est obligatoire.")
    conn.execute("UPDATE playlists SET name = ? WHERE id = ?", (body.name.strip(), playlist_id))
    return _playlist_view(conn, _playlist(conn, user, playlist_id))


@router.delete("/me/playlists/{playlist_id}")
def delete_playlist(playlist_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    _playlist(conn, user, playlist_id)
    conn.execute("DELETE FROM playlist_tracks WHERE playlist_id = ?", (playlist_id,))
    conn.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
    return {"deleted": True}


@router.put("/me/playlists/{playlist_id}/tracks/{track_id}")
def add_to_playlist(
    playlist_id: str, track_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")
):
    _playlist(conn, user, playlist_id)
    _track_or_404(track_id)
    position = conn.execute(
        "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM playlist_tracks WHERE playlist_id = ?",
        (playlist_id,),
    ).fetchone()["p"]
    conn.execute(
        "INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)",
        (playlist_id, track_id, position),
    )
    return _playlist_view(conn, _playlist(conn, user, playlist_id))


@router.delete("/me/playlists/{playlist_id}/tracks/{track_id}")
def remove_from_playlist(
    playlist_id: str, track_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")
):
    _playlist(conn, user, playlist_id)
    conn.execute(
        "DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?", (playlist_id, track_id)
    )
    return _playlist_view(conn, _playlist(conn, user, playlist_id))


# --- Journal d'écoutes (base du compteur artiste et du calcul des royalties au MVP 2) ---
MIN_PLAY_SECONDS = 30  # règle de comptage d'une écoute, à valider


@router.post("/plays", status_code=201)
def log_play(body: PlayIn, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    _track_or_404(body.trackId)
    if body.seconds < MIN_PLAY_SECONDS:
        return {"counted": False, "reason": f"Écoute inférieure à {MIN_PLAY_SECONDS} s"}
    conn.execute(
        "INSERT INTO plays (user_id, track_id, seconds, played_at) VALUES (?, ?, ?, ?)",
        (user["id"], body.trackId, body.seconds, now()),
    )
    return {"counted": True}


@router.get("/me/plays")
def my_plays(user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    index = catalog.track_index()
    rows = conn.execute(
        "SELECT track_id, seconds, played_at FROM plays WHERE user_id = ? ORDER BY played_at DESC LIMIT 100",
        (user["id"],),
    ).fetchall()
    return [
        {"track": index.get(r["track_id"]), "seconds": r["seconds"], "playedAt": iso(r["played_at"])}
        for r in rows
    ]
