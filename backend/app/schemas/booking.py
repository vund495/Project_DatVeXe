from datetime import datetime

from .camel import CamelModel
from .auth import UserOut
from .trip import TripDto


class BookingDto(CamelModel):
    id: int
    booking_code: str
    status: str
    passenger_name: str
    passenger_phone: str
    passenger_email: str
    seat_count: int
    seats: str
    total_price: int
    user: UserOut
    trip: TripDto
    created_at: datetime


class CreateBookingRequest(CamelModel):
    trip_id: int
    passenger_name: str
    passenger_phone: str
    passenger_email: str
    seat_count: int
    seats: str
