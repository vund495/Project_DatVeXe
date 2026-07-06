from datetime import date, datetime, timedelta, time, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.bus_operator import BusOperator
from app.models.bus_route import BusRoute
from app.models.city import City
from app.models.trip import Trip
from app.schemas.route import RouteDto
from app.schemas.trip import TripDto


def _trip_to_dto(trip: Trip) -> TripDto:
    return TripDto(
        id=trip.id,
        origin=trip.route.origin.name,
        destination=trip.route.destination.name,
        operator_name=trip.operator.name,
        operator_rating=trip.operator.rating,
        bus_type=trip.operator.bus_type,
        badge=trip.route.badge,
        departure_time=trip.departure_time,
        arrival_time=trip.arrival_time,
        price=trip.price,
        total_seats=trip.total_seats,
        available_seats=trip.available_seats,
        duration_minutes=trip.route.duration_minutes,
        route_id=trip.route_id,
        operator_id=trip.operator_id,
    )


async def get_by_id(db: AsyncSession, trip_id: int) -> TripDto | None:
    stmt = (
        select(Trip)
        .join(Trip.route).join(BusRoute.origin).join(BusRoute.destination)
        .join(Trip.operator)
        .where(Trip.id == trip_id)
    )
    result = await db.execute(stmt)
    trip = result.scalar_one_or_none()
    if not trip:
        return None
    return _trip_to_dto(trip)


async def search(
    db: AsyncSession,
    origin: str | None,
    destination: str | None,
    travel_date: date | None,
    limit: int = 100,
) -> list[TripDto]:
    travel_date = travel_date or date.today()
    from_dt = datetime.combine(travel_date, time.min, tzinfo=timezone.utc)
    to_dt = from_dt + timedelta(days=1)

    origin_city = aliased(City)
    dest_city = aliased(City)

    stmt = (
        select(Trip)
        .join(Trip.route)
        .join(origin_city, BusRoute.origin_id == origin_city.id)
        .join(dest_city, BusRoute.destination_id == dest_city.id)
        .join(Trip.operator)
        .where(Trip.departure_time >= from_dt)
        .where(Trip.departure_time < to_dt)
    )
    if origin:
        stmt = stmt.where(func.lower(origin_city.name).like(f"%{origin.lower()}%"))
    if destination:
        stmt = stmt.where(func.lower(dest_city.name).like(f"%{destination.lower()}%"))
    stmt = stmt.order_by(Trip.departure_time.asc(), Trip.price.asc()).limit(limit)

    result = await db.execute(stmt)
    return [_trip_to_dto(t) for t in result.scalars().all()]


async def popular_routes(db: AsyncSession, limit: int = 10) -> list[RouteDto]:
    dest = aliased(City)
    rows = await db.execute(
        select(
            BusRoute.id,
            City.name.label("origin"),
            dest.name.label("destination"),
            BusRoute.distance_km,
            BusRoute.duration_minutes,
            BusRoute.badge,
            func.min(Trip.price).label("min_price"),
            func.coalesce(func.sum(Trip.total_seats - Trip.booked_seats), 0).label("available_seats"),
        )
        .select_from(BusRoute)
        .join(City, BusRoute.origin_id == City.id)
        .join(dest, BusRoute.destination_id == dest.id)
        .outerjoin(Trip, Trip.route_id == BusRoute.id)
        .group_by(BusRoute.id, City.name, dest.name)
        .order_by(func.coalesce(func.sum(Trip.total_seats - Trip.booked_seats), 0).desc())
        .limit(limit)
    )
    return [
        RouteDto(
            id=r.id,
            origin=r.origin,
            destination=r.destination,
            distance_km=r.distance_km,
            duration_minutes=r.duration_minutes,
            badge=r.badge,
            min_price=int(r.min_price) if r.min_price else 0,
            available_seats=int(r.available_seats),
        )
        for r in rows
    ]


def _blank_to_none(value: str | None) -> str | None:
    if value is None or value.strip() == "":
        return None
    return value.strip()
