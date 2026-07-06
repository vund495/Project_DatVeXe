import uuid
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.booking import Booking
from app.models.trip import Trip
from app.schemas.booking import BookingDto, CreateBookingRequest


def _booking_to_dto(booking: Booking) -> BookingDto:
    from .trip import _trip_to_dto
    from app.schemas.auth import UserOut
    user_out = UserOut(
        id=booking.user.id,
        email=booking.user.email,
        name=booking.user.name,
        phone=booking.user.phone,
        role=booking.user.role,
        permissions=booking.user.permissions,
    )
    return BookingDto(
        id=booking.id,
        booking_code=booking.booking_code,
        status=booking.status,
        passenger_name=booking.passenger_name,
        passenger_phone=booking.passenger_phone,
        passenger_email=booking.passenger_email,
        seat_count=booking.seat_count,
        seats=booking.seats,
        total_price=booking.total_price,
        user=user_out,
        trip=_trip_to_dto(booking.trip),
        created_at=booking.created_at,
    )


async def _load_trip(db: AsyncSession, trip_id: int) -> Trip | None:
    stmt = (
        select(Trip)
        .options(joinedload(Trip.route).joinedload("*"), joinedload(Trip.operator))
        .where(Trip.id == trip_id)
    )
    result = await db.execute(stmt)
    return result.unique().scalar_one_or_none()


async def _load_booking(db: AsyncSession, booking_id: int) -> Booking | None:
    stmt = (
        select(Booking)
        .options(joinedload(Booking.trip).joinedload("*"))
        .where(Booking.id == booking_id)
    )
    result = await db.execute(stmt)
    return result.unique().scalar_one_or_none()


async def create(db: AsyncSession, user_id: int, request: CreateBookingRequest) -> BookingDto:
    trip = await _load_trip(db, request.trip_id)
    if not trip:
        raise ValueError("Trip not found")
    trip.reserve_seats(request.seat_count)
    total_price = trip.price * request.seat_count
    booking = Booking(
        user_id=user_id,
        trip_id=trip.id,
        passenger_name=request.passenger_name,
        passenger_phone=request.passenger_phone,
        passenger_email=request.passenger_email,
        seat_count=request.seat_count,
        seats=request.seats,
        total_price=total_price,
        booking_code=_generate_code(),
    )
    db.add(booking)
    try:
        await db.flush()
        await db.refresh(booking)
    except StaleDataError:
        raise ValueError("Ghế đã có người khác đặt trước, vui lòng chọn ghế khác.")
    return _booking_to_dto(booking)


async def pay(db: AsyncSession, booking_id: int, user_id: int) -> BookingDto:
    booking = await _load_booking(db, booking_id)
    if not booking:
        raise ValueError("Booking not found")
    if booking.user_id != user_id:
        raise ValueError("Unauthorized: This booking belongs to another user")
    if booking.status == "PAID":
        raise ValueError("Booking already paid")
    age = datetime.now(timezone.utc) - booking.created_at
    if age > timedelta(minutes=15):
        raise ValueError("Payment time has expired")
    booking.pay()
    await db.flush()
    return _booking_to_dto(booking)


async def cancel(db: AsyncSession, booking_id: int, user_id: int) -> BookingDto:
    booking = await _load_booking(db, booking_id)
    if not booking:
        raise ValueError("Booking not found")
    if booking.user_id != user_id:
        raise ValueError("Unauthorized: This booking belongs to another user")
    if booking.status == "CANCELLED":
        raise ValueError("Booking already cancelled")
    # Refund: unreserve seats
    if booking.status in ["PENDING_PAYMENT", "PAID"]:
        booking.trip.booked_seats = max(0, booking.trip.booked_seats - booking.seat_count)
    booking.status = "CANCELLED"
    await db.flush()
    return _booking_to_dto(booking)


async def lookup(db: AsyncSession, query: str, limit: int = 100) -> list[BookingDto]:
    stmt = (
        select(Booking)
        .options(joinedload(Booking.trip).joinedload("*"))
        .where(
            Booking.passenger_phone.contains(query)
            | Booking.booking_code.ilike(f"%{query}%")
        )
        .order_by(Booking.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [_booking_to_dto(b) for b in result.unique().scalars().all()]


async def count_bookings_today(db: AsyncSession) -> int:
    today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
    stmt = select(Booking).where(Booking.created_at >= today_start)
    result = await db.execute(stmt)
    return len(result.scalars().all())


def _generate_code() -> str:
    return "VRX-" + uuid.uuid4().hex[:8].upper()
