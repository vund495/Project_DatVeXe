from .camel import CamelModel


class RouteDto(CamelModel):
    id: int
    origin: str
    destination: str
    distance_km: int
    duration_minutes: int
    badge: str
    min_price: int
    available_seats: int
