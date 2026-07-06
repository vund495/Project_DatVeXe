from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.trip import Trip
    from app.models.user import User


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), nullable=False)
    passenger_name: Mapped[str] = mapped_column(String(200))
    passenger_phone: Mapped[str] = mapped_column(String(20))
    passenger_email: Mapped[str] = mapped_column(String(200))
    seat_count: Mapped[int]
    seats: Mapped[str] = mapped_column(String(200))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 0))
    status: Mapped[str] = mapped_column(String(20), default="PENDING_PAYMENT")
    booking_code: Mapped[str] = mapped_column(String(20), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(lazy="joined")
    trip: Mapped["Trip"] = relationship(lazy="joined")

    def pay(self) -> None:
        self.status = "PAID"
