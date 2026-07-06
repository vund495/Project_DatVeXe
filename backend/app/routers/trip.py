from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.route import RouteDto
from app.schemas.trip import TripDto
from app.services import trip as trip_service

router = APIRouter(tags=["trip"])


@router.get("/api/trips/search")
async def search_trips(
    origin: str | None = Query(None),
    destination: str | None = Query(None),
    date_: date | None = Query(None, alias="date"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[TripDto]:
    return await trip_service.search(db, origin, destination, date_, limit)


@router.get("/api/trips/{trip_id}")
async def get_trip(
    trip_id: int,
    db: AsyncSession = Depends(get_db),
) -> TripDto:
    trip = await trip_service.get_by_id(db, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("/api/routes/popular")
async def popular_routes(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[RouteDto]:
    return await trip_service.popular_routes(db, limit)
