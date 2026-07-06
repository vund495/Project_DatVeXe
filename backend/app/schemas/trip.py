from datetime import datetime

from .camel import CamelModel


class TripDto(CamelModel):
    id: int
    origin: str
    destination: str
    operator_name: str
    operator_rating: float
    bus_type: str
    badge: str
    departure_time: datetime
    arrival_time: datetime
    price: int
    total_seats: int
    available_seats: int
    duration_minutes: int
    route_id: int | None = None
    operator_id: int | None = None

