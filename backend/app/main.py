import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1 import auth, calendar, notes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialise Beanie + MongoDB
    try:
        await init_db()
    except Exception as exc:
        logger.error(f"STARTUP FAILED — could not connect to MongoDB: {exc}")
        raise
    yield
    # Shutdown: close Motor client
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for the AI Academic Helper",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(calendar.router, prefix=API_PREFIX)
app.include_router(notes.router, prefix=API_PREFIX)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}
