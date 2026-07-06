from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BusOperator(Base):
    __tablename__ = "operators"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    rating: Mapped[float]
    bus_type: Mapped[str] = mapped_column(String(50))
    badge: Mapped[str] = mapped_column(String(50))
