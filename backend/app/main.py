"""Point d'entrée du back-end simulé Ô musiki.

Lancement (depuis le dossier backend/) :
    uvicorn app.main:app --port 3001 --reload
Documentation interactive : http://localhost:3001/docs
"""
import asyncio
import logging
import random
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import catalog, config, db
from .errors import ApiError, api_error_handler
from .routers import auth, billing, catalog as catalog_router, dev, library, me

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
log = logging.getLogger("omusiki")

@asynccontextmanager
async def lifespan(_app: FastAPI):
    db.init_db()
    count = len(catalog.tracks())
    log.warning("Base : %s — catalogue : %d titres — outils de test : %s", config.DB_PATH, count, config.DEV_TOOLS)
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Ô musiki — back-end simulé",
    description=(
        "API locale qui simule les services managés du MVP 1 : identité (Cognito), API cœur "
        "(catalogue, bibliothèque, écoutes), paiement carte (Stripe) et mobile money (Aftawallet). "
        "**Développement uniquement.**"
    ),
    version="1.0.0",
)

app.add_exception_handler(ApiError, api_error_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXEMPT = ("/api/dev", "/api/sim", "/docs", "/openapi.json", "/api/health")


@app.middleware("http")
async def simulate_network(request: Request, call_next):
    """Latence et pannes simulées (réglables via PUT /api/dev/settings)."""
    path = request.url.path
    if path.startswith("/api") and not path.startswith(EXEMPT):
        if dev.SETTINGS["latencyMs"]:
            await asyncio.sleep(dev.SETTINGS["latencyMs"] / 1000)
        if dev.SETTINGS["failRate"] and random.random() < dev.SETTINGS["failRate"]:
            return JSONResponse(
                status_code=503,
                content={"error": "ServiceUnavailable", "message": "Panne simulée."},
            )
    return await call_next(request)


@app.get("/api/health", tags=["Santé"])
def health():
    return {"status": "ok", "tracks": len(catalog.tracks()), "devTools": config.DEV_TOOLS}


for module in (auth, me, catalog_router, library, billing):
    app.include_router(module.router)
if config.DEV_TOOLS:
    app.include_router(dev.router)
