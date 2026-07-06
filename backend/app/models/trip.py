from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), nullable=False)
    operator_id: Mapped[int] = mapped_column(ForeignKey("operators.id"), nullable=False)
    departure_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    arrival_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 0))
    total_seats: Mapped[int]
    booked_seats: Mapped[int]
    version: Mapped[int] = mapped_column(Integer, default=0)

    __mapper_args__ = {"version_id_col": version}

    route: Mapped["BusRoute"] = relationship(lazy="joined")
    operator: Mapped["BusOperator"] = relationship(lazy="joined")

    @property
    def available_seats(self) -> int:
        return self.total_seats - self.booked_seats

    def reserve_seats(self, seats: int) -> None:
        if seats <= 0:
            raise ValueError("Seat count must be greater than zero")
        if self.booked_seats + seats > self.total_seats:
            raise ValueError("Not enough available seats")
        self.booked_seats += seats
