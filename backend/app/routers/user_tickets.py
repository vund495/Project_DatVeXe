from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.models.booking import Booking
from app.models.user import User
from app.models.trip import Trip
from app.schemas.booking import BookingDto
from app.services.booking import _booking_to_dto
from app.services.deps import get_current_user

router = APIRouter(tags=["user"])


@router.get("/api/my-bookings")
async def my_bookings(
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[BookingDto]:
    stmt = (
        select(Booking)
        .options(joinedload(Booking.trip).joinedload("*"), joinedload(Booking.user))
        .where(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_booking_to_dto(b) for b in result.unique().scalars().all()]
