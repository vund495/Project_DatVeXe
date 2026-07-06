from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.city import City
from app.schemas.city import CityDto
from app.schemas.dashboard import DashboardDto
from app.services import dashboard as dashboard_service

router = APIRouter(tags=["meta"])


@router.get("/api/cities")
async def list_cities(db: AsyncSession = Depends(get_db)) -> list[CityDto]:
    result = await db.execute(select(City).order_by(City.id))
    cities = result.scalars().all()
    return [CityDto(id=c.id, name=c.name, region=c.region) for c in cities]


@router.get("/api/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)) -> DashboardDto:
    return await dashboard_service.metrics(db)
