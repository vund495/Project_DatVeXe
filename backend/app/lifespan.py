import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import async_session_factory, engine, Base
from app.core.seed import seed_database, ensure_upcoming_trips

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup...")
    try:
        logger.info("Creating tables...")
        async with asyncio.timeout(10):  # 10 second timeout
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Seeding database...")
            async with async_session_factory() as session:
                await seed_database(session)
                await ensure_upcoming_trips(session, days_ahead=14)
                await session.commit()
            logger.info("Database ready!")
    except asyncio.TimeoutError:
        logger.warning("Database initialization timeout. Continuing without database setup...")
    except Exception as e:
        logger.warning(f"Failed to initialize database: {e}. Continuing anyway...")
    
    logger.info("Ready!")
    yield
    
    logger.info("Application shutdown...")
    try:
        await engine.dispose()
    except Exception as e:
        logger.warning(f"Failed to dispose engine: {e}")
