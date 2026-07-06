from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.models.booking import Booking
from app.models.bus_operator import BusOperator
from app.models.bus_route import BusRoute
from app.models.city import City
from app.models.trip import Trip
from app.models.user import User
from app.schemas.admin import (
    CreateTripRequest, 
    UpdateTripRequest,
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
)
from app.schemas.route import RouteDto
from app.schemas.trip import TripDto
from app.services.deps import require_permission
from app.services.trip import _trip_to_dto
from app.services.auth import hash_password

router = APIRouter(tags=["admin"])


def _route_to_dto(route: BusRoute) -> RouteDto:
    return RouteDto(
        id=route.id,
        origin=route.origin.name,
        destination=route.destination.name,
        distance_km=route.distance_km,
        duration_minutes=route.duration_minutes,
        badge=route.badge,
        min_price=0,
        available_seats=0,
    )

@router.get("/api/admin/users")
async def list_users(
    admin: User = Depends(require_permission("users:manage")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    stmt = (
        select(User)
        .order_by(User.id.asc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            permissions=u.permissions or "",
        )
        for u in users
    ]


@router.post("/api/admin/users")
async def create_user(
    user_data: CreateUserRequest,
    admin: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        permissions=user_data.permissions,
        password_hash=hash_password("TempPassword123!"),  
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        permissions=new_user.permissions or "",
    )


@router.put("/api/admin/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UpdateUserRequest,
    admin: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Atualizar informações do usuário"""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if admin.id == user_id and user_data.role == "user" and user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot remove admin role from yourself")

    if user_data.name is not None:
        user.name = user_data.name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.permissions is not None:
        user.permissions = user_data.permissions

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        permissions=user.permissions or "",
    )


@router.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_permission("users:manage")),
    db: AsyncSession = Depends(get_db),
):
    """Deletar usuário"""
    if admin.id == user_id:
        raise HTTPException(status_code=403, detail="Cannot delete your own account")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    admin_count = await db.execute(select(func.count(User.id)).where(User.role == "admin"))
    if user.role == "admin" and admin_count.scalar() == 1:
        raise HTTPException(status_code=403, detail="Cannot delete the last admin user")

    await db.delete(user)
    await db.commit()

    return {"status": "deleted", "id": user_id}

@router.get("/api/admin/trips")
async def list_trips(
    admin: User = Depends(require_permission("trips:view")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[TripDto]:
    stmt = (
        select(Trip)
        .options(joinedload(Trip.route).joinedload("*"), joinedload(Trip.operator))
        .order_by(Trip.departure_time.asc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_trip_to_dto(t) for t in result.unique().scalars().all()]


@router.post("/api/admin/trips")
async def create_trip(
    request: CreateTripRequest,
    admin: User = Depends(require_permission("trips:manage")),
    db: AsyncSession = Depends(get_db),
) -> TripDto:
    route = await db.get(BusRoute, request.route_id)
    operator = await db.get(BusOperator, request.operator_id)
    if not route or not operator:
        raise HTTPException(status_code=404, detail="Route or operator not found")
    arr = request.departure_time + timedelta(minutes=route.duration_minutes)
    trip = Trip(
        route_id=route.id,
        operator_id=operator.id,
        departure_time=request.departure_time,
        arrival_time=arr,
        price=request.price,
        total_seats=request.total_seats,
        booked_seats=0,
    )
    db.add(trip)
    await db.flush()
    await db.refresh(trip, ["route", "operator"])
    trip.route = route
    trip.operator = operator
    return _trip_to_dto(trip)


@router.put("/api/admin/trips/{trip_id}")
async def update_trip(
    trip_id: int,
    request: UpdateTripRequest,
    admin: User = Depends(require_permission("trips:manage")),
    db: AsyncSession = Depends(get_db),
) -> TripDto:
    trip = await db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if request.price is not None:
        trip.price = request.price
    if request.total_seats is not None:
        trip.total_seats = request.total_seats
    if request.departure_time is not None:
        trip.departure_time = request.departure_time
        trip.arrival_time = request.departure_time + timedelta(minutes=trip.route.duration_minutes)
    await db.flush()
    await db.refresh(trip, ["route", "operator"])
    return _trip_to_dto(trip)


@router.delete("/api/admin/trips/{trip_id}")
async def delete_trip(
    trip_id: int,
    admin: User = Depends(require_permission("trips:manage")),
    db: AsyncSession = Depends(get_db),
):
    trip = await db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    booking_count = await db.execute(
        select(func.count(Booking.id)).where(Booking.trip_id == trip_id)
    )
    if booking_count.scalar() > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete trip with existing bookings. Cancel all bookings first.",
        )

    await db.delete(trip)
    await db.flush()
    return {"status": "deleted"}


@router.get("/api/admin/routes")
async def list_routes(
    admin: User = Depends(require_permission("routes:view")),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[RouteDto]:
    stmt = (
        select(BusRoute)
        .options(joinedload(BusRoute.origin), joinedload(BusRoute.destination))
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_route_to_dto(r) for r in result.unique().scalars().all()]


@router.get("/api/admin/operators")
async def list_operators(
    admin: User = Depends(require_permission("routes:view")),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(BusOperator).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [{"id": o.id, "name": o.name, "busType": o.bus_type} for o in result.scalars().all()]


@router.get("/api/admin/cities")
async def list_cities_for_admin(
    admin: User = Depends(require_permission("routes:view")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(City).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [{"id": c.id, "name": c.name} for c in result.scalars().all()]


@router.get("/api/admin/stats")
async def admin_stats(
    admin: User = Depends(require_permission("trips:view")),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
    
    # Today's metrics
    bookings_today = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= today_start)
    )
    tickets_today = bookings_today.scalar() or 0
    
    revenue_today = await db.execute(
        select(func.sum(Booking.total_price)).where(
            Booking.created_at >= today_start,
            Booking.status == "PAID"
        )
    )
    revenue = revenue_today.scalar() or 0
    
    # All time metrics
    total_users = await db.execute(select(func.count(User.id)))
    users_count = total_users.scalar() or 0
    
    total_bookings = await db.execute(select(func.count(Booking.id)))
    bookings_count = total_bookings.scalar() or 0
    
    total_revenue = await db.execute(
        select(func.sum(Booking.total_price)).where(Booking.status == "PAID")
    )
    total_rev = total_revenue.scalar() or 0
    
    # Booking status breakdown
    pending = await db.execute(
        select(func.count(Booking.id)).where(Booking.status == "PENDING_PAYMENT")
    )
    cancelled = await db.execute(
        select(func.count(Booking.id)).where(Booking.status == "CANCELLED")
    )
    paid = await db.execute(
        select(func.count(Booking.id)).where(Booking.status == "PAID")
    )
    
    return {
        "todayStats": {
            "bookings": tickets_today,
            "revenue": int(revenue),
        },
        "allTimeStats": {
            "totalUsers": users_count,
            "totalBookings": bookings_count,
            "totalRevenue": int(total_rev),
        },
        "bookingStatus": {
            "pending": pending.scalar() or 0,
            "paid": paid.scalar() or 0,
            "cancelled": cancelled.scalar() or 0,
        },
    }
