"""Catalogue : recherche, collections de l'accueil, autorisation d'écoute."""
import sqlite3

from fastapi import APIRouter, Depends, Query

from .. import catalog
from ..billing import subscription_view
from ..db import get_db
from ..errors import forbidden, not_found
from ..security import current_user

router = APIRouter(prefix="/api", tags=["Catalogue"])


def _with_plays(conn: sqlite3.Connection, track: dict) -> dict:
    count = conn.execute("SELECT COUNT(*) AS n FROM plays WHERE track_id = ?", (track["id"],)).fetchone()["n"]
    return {**track, "platformPlays": count}


@router.get("/tracks")
def list_tracks(
    q: str = "",
    genre: str = "",
    country: str = "",
    year: int | None = None,
    limit: int = Query(50, ge=1, le=200),
):
    return catalog.search(q, genre, country, year, limit)


@router.get("/tracks/{track_id}")
def get_track(track_id: str, conn: sqlite3.Connection = Depends(get_db, scope="function")):
    track = catalog.get_track(track_id)
    if not track:
        raise not_found("TrackNotFound", "Titre introuvable.")
    return _with_plays(conn, track)


@router.get("/tracks/{track_id}/stream")
def stream(track_id: str, user=Depends(current_user), conn: sqlite3.Connection = Depends(get_db, scope="function")):
    """Autorise l'écoute si l'abonnement est actif.

    Production : renverra une URL de lecture Mux signée et limitée dans le temps.
    """
    track = catalog.get_track(track_id)
    if not track:
        raise not_found("TrackNotFound", "Titre introuvable.")
    if not subscription_view(conn, user["id"])["hasAccess"]:
        raise forbidden("SubscriptionRequired", "Un abonnement actif est nécessaire pour écouter.")
    return {"trackId": track_id, "url": track["audioUrl"], "expiresIn": 3600}


@router.get("/catalog/genres")
def genres():
    return sorted({t["genre"] for t in catalog.tracks()})


@router.get("/catalog/countries")
def countries():
    return sorted({t["country"] for t in catalog.tracks()})


@router.get("/collections/home")
def home():
    return catalog.home()


@router.get("/collections/{collection_id}")
def collection(collection_id: str):
    item = catalog.find_collection(collection_id)
    if not item:
        raise not_found("CollectionNotFound", "Collection introuvable.")
    return item
