import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings

logger = logging.getLogger(__name__)
_mongo_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,
        )
    return _mongo_client


async def init_db() -> None:
    """Initialise Beanie with all document models."""
    from app.models.models import UserProfile, CalendarEvent, AcademicNote  # avoid circular imports

    logger.info("Connecting to MongoDB...")
    client = get_mongo_client()
    db_name = "campus_canteen"
    await init_beanie(
        database=client[db_name],
        document_models=[UserProfile, CalendarEvent, AcademicNote],
    )
    logger.info("MongoDB connected — Beanie initialised ✓")


async def close_db() -> None:
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        logger.info("MongoDB connection closed.")
