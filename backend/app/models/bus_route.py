from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BusRoute(Base):
    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(primary_key=True)
    origin_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    destination_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    distance_km: Mapped[int]
    duration_minutes: Mapped[int]
    badge: Mapped[str] = mapped_column(String(50))

    origin: Mapped["City"] = relationship(foreign_keys=[origin_id], lazy="joined")
    destination: Mapped["City"] = relationship(foreign_keys=[destination_id], lazy="joined")
