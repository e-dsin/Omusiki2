"""Catalogue musical : lu dans src/services/musicDatabase.js (mêmes données que le front).

Les règles de recherche et de construction des collections reprennent celles du front
(MusicSearchService, PlaylistGenerator, services/homeCollections.js).
"""
import json
import logging
import re
from functools import lru_cache

import json5

from . import config

log = logging.getLogger("omusiki.catalog")

REGION_MAP = {
    "west-africa": ["Nigeria", "Ghana", "Ivory Coast", "Senegal", "Mali", "Burkina Faso", "Sierra Leone", "Liberia"],
    "central-africa": ["Cameroon", "Congo", "DRC", "Central African Republic", "Gabon", "Equatorial Guinea", "Chad", "São Tomé and Príncipe"],
    "east-africa": ["Kenya", "Ethiopia", "Tanzania", "Uganda", "Rwanda"],
    "north-africa": ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya"],
    "south-africa": ["South Africa"],
    "caribbean": ["Martinique", "Trinidad"],
    "jamaica": ["Jamaica"],
    "european": ["France", "United Kingdom", "Germany", "Netherlands"],
    "asian": ["Japan", "South Korea", "China", "Thailand"],
    "indian": ["India"],
    "australian": ["Australia"],
}

COVER_A = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
COVER_B = "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop"

CHARTS = [
    ("chart_cameroon", "Cameroon Hits", "Makossa • Bikutsi • Afropop moderne", "country", "Cameroon", COVER_A),
    ("chart_nigeria", "Nigerian Hits", "Afrobeats • Highlife • Afropop", "country", "Nigeria", COVER_B),
    ("chart_ivory_coast", "Ivory Coast Hits", "Coupé-Décalé • Zouglou • Afropop", "country", "Ivory Coast", COVER_A),
    ("chart_congo", "Congo Hits", "Ndombolo • Rumba • Soukous", "country", "Congo", COVER_B),
    ("chart_central_africa", "Central Africa Hits", "Cameroun • Congo • Gabon • RCA", "region", "central-africa", COVER_A),
    ("chart_west_africa", "West Africa Hits", "Nigeria • Ghana • Ivory Coast • Senegal", "region", "west-africa", COVER_B),
    ("chart_east_africa", "East Africa Hits", "Kenya • Tanzania • Uganda • Rwanda", "region", "east-africa", COVER_A),
    ("chart_north_africa", "North Africa Hits", "Maroc • Algérie • Tunisie • Égypte", "region", "north-africa", COVER_B),
    ("chart_south_africa", "South Africa Hits", "House • Gqom • Amapiano • Hip-Hop", "country", "South Africa", COVER_B),
    ("chart_caribbean", "Caribbean Hits", "Zouk • Soca • Dancehall fusion", "region", "caribbean", COVER_A),
    ("chart_jamaica", "Jamaican Hits", "Reggae • Dancehall • Roots", "country", "Jamaica", COVER_B),
    ("chart_world_music", "World Music", "Fusion Globale • Collaborations Internationales", "world", "world", COVER_A),
]

_ARRAY_RE = re.compile(r"export\s+const\s+MUSIC_DATABASE\s*=\s*(\[.*?\n\s*\]);", re.DOTALL)


def parse_music_database(source: str) -> list[dict]:
    match = _ARRAY_RE.search(source)
    if not match:
        raise ValueError("Tableau MUSIC_DATABASE introuvable dans le fichier.")
    return json5.loads(match.group(1))


@lru_cache(maxsize=1)
def tracks() -> tuple[dict, ...]:
    if config.CATALOG_JS.exists():
        data = parse_music_database(config.CATALOG_JS.read_text(encoding="utf-8"))
        log.warning("Catalogue chargé depuis %s (%d titres)", config.CATALOG_JS, len(data))
    else:
        data = json.loads(config.CATALOG_FALLBACK.read_text(encoding="utf-8"))
        log.warning(
            "Fichier %s introuvable : catalogue de secours (%d titres)", config.CATALOG_JS, len(data)
        )
    return tuple(data)


def track_index() -> dict[str, dict]:
    return {t["id"]: t for t in tracks()}


def get_track(track_id: str) -> dict | None:
    return track_index().get(track_id)


def search(q: str = "", genre: str = "", country: str = "", year: int | None = None, limit: int = 50) -> list[dict]:
    q = (q or "").strip().lower()
    result = []
    for t in tracks():
        if q and not (
            q in t["title"].lower()
            or q in t["artist"].lower()
            or q in t.get("album", "").lower()
            or q in t["genre"].lower()
            or q in t["country"].lower()
            or any(q in tag for tag in t.get("tags", []))
            or q in t.get("description", "").lower()
        ):
            continue
        if genre and t["genre"].lower() != genre.lower():
            continue
        if country and t["country"].lower() != country.lower():
            continue
        if year and t.get("year") != year:
            continue
        result.append(t)
    return result[:limit]


def by_genre(genre: str) -> list[dict]:
    return [t for t in tracks() if t["genre"].lower() == genre.lower()]


def by_country(country: str) -> list[dict]:
    return [t for t in tracks() if t["country"].lower() == country.lower()]


def by_region(region: str) -> list[dict]:
    countries = REGION_MAP.get(region.lower(), [])
    return [t for t in tracks() if t["country"] in countries]


def world_fusion() -> list[dict]:
    return [
        t
        for t in tracks()
        if "fusion" in t.get("tags", []) or "fusion" in t["genre"] or t["genre"] in ("world", "world-fusion")
    ]


def popular(limit: int = 10) -> list[dict]:
    return sorted(tracks(), key=lambda t: t["streams"], reverse=True)[:limit]


def new_releases(limit: int = 8) -> list[dict]:
    recent = [t for t in tracks() if t.get("year", 0) >= 2023]
    return sorted(recent, key=lambda t: t["year"], reverse=True)[:limit]


def top_genres(limit: int = 8) -> list[tuple[str, int]]:
    counts: dict[str, int] = {}
    for t in tracks():
        counts[t["genre"]] = counts.get(t["genre"], 0) + t["streams"]
    return sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:limit]


def _total_minutes(songs: list[dict]) -> int:
    return sum(s["duration"] for s in songs) // 60


def _total_duration(songs: list[dict]) -> str:
    minutes = _total_minutes(songs)
    return f"{minutes // 60}h {minutes % 60}min" if minutes >= 60 else f"{minutes}min"


def _collection(cid, title, subtitle, cover, playlist, ctype, duration=None, **extra) -> dict:
    return {
        "id": cid,
        "title": title,
        "artist": subtitle,
        "cover": cover,
        "duration": duration or f"{_total_minutes(playlist)}min",
        "tracks": len(playlist),
        "audioUrl": playlist[0]["audioUrl"] if playlist else None,
        "playlist": playlist,
        "type": ctype,
        "streams": sum(s["streams"] for s in playlist),
        **extra,
    }


def charts() -> list[dict]:
    result = []
    for cid, title, subtitle, category, key, cover in CHARTS:
        if category == "country":
            playlist, extra = by_country(key), {"category": category, "country": key}
        elif category == "region":
            playlist, extra = by_region(key), {"category": category, "region": key}
        else:
            playlist, extra = world_fusion(), {"category": category, "region": key}
        result.append(
            _collection(cid, title, subtitle, cover, playlist, "chart", _total_duration(playlist), **extra)
        )
    return result


def made_for_you() -> list[dict]:
    afro = sorted(by_genre("afrobeats") + by_genre("afropop"), key=lambda t: t["streams"], reverse=True)
    trad = sum((by_genre(g) for g in ("traditional", "makossa", "highlife", "mbalax")), [])
    modern = sum((by_genre(g) for g in ("amapiano", "afrobeats", "coupe-decale", "ndombolo")), [])
    fusion = world_fusion()
    specs = [
        ("playlist_afrobeats", "Mix Afrobeats Essentiel", "Hits incontournables", afro, COVER_B),
        ("playlist_traditional", "Trésors Traditionnels", "Patrimoine musical", trad, COVER_A),
        ("playlist_modern", "Afrique Moderne", "Sons contemporains", modern, COVER_B),
        ("playlist_fusion", "World Fusion", "Mélange global", fusion, COVER_B),
    ]
    return [
        _collection(cid, title, f"{len(pl)} titres • {tag}", pl[0]["cover"] if pl else cover, pl, "playlist")
        for cid, title, tag, pl, cover in specs
    ]


def genres() -> list[dict]:
    result = []
    for genre, streams in top_genres(8):
        songs = by_genre(genre)
        countries = list(dict.fromkeys(s["country"] for s in songs))[:3]
        item = _collection(
            f"genre_{genre}",
            f"{genre[:1].upper()}{genre[1:]} Collection",
            f"{len(songs)} titres • {', '.join(countries)}",
            songs[0]["cover"] if songs else COVER_B,
            songs,
            "genre",
            genre=genre,
            country=songs[0]["country"] if songs else None,
        )
        item["streams"] = streams
        result.append(item)
    return result


def discoveries() -> list[dict]:
    result = []
    for country in ("Cameroon", "Nigeria", "Ivory Coast", "Congo"):
        songs = by_country(country)[:6]
        result.append(
            _collection(
                f"discovery_{country.lower()}",
                f"Découvertes {country}",
                f"{len(songs)} artistes • Talents émergents",
                songs[0]["cover"] if songs else COVER_A,
                songs,
                "discovery",
                country=country,
            )
        )
    return result


def home() -> dict:
    return {
        "topChartsData": charts(),
        "trendingData": popular(10),
        "newReleasesData": new_releases(8),
        "madeForYouData": made_for_you(),
        "genresData": genres(),
        "discoveryData": discoveries(),
    }


def find_collection(collection_id: str) -> dict | None:
    for item in charts() + made_for_you() + genres() + discoveries():
        if item["id"] == collection_id:
            return item
    return None
