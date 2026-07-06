from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.models.booking import Booking
from app.models.user import User
from app.schemas.booking import BookingDto, CreateBookingRequest
from app.services import booking as booking_service
from app.services.deps import get_current_user

router = APIRouter(tags=["booking"])


@router.get("/api/bookings/{booking_id}")
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingDto:
    stmt = (
        select(Booking)
        .options(joinedload(Booking.trip).joinedload("*"), joinedload(Booking.user))
        .where(Booking.id == booking_id)
    )
    result = await db.execute(stmt)
    booking = result.unique().scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this booking")
        
    return booking_service._booking_to_dto(booking)


@router.post("/api/bookings")
async def create_booking(
    request: CreateBookingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingDto:
    return await booking_service.create(db, current_user.id, request)


@router.post("/api/bookings/{booking_id}/pay")
async def pay_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingDto:
    return await booking_service.pay(db, booking_id, current_user.id)


@router.post("/api/bookings/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BookingDto:
    return await booking_service.cancel(db, booking_id, current_user.id)


@router.get("/api/bookings/lookup")
async def lookup_bookings(
    query: str = Query(..., min_length=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BookingDto]:
    return await booking_service.lookup(db, query, limit)