"""add_indexes

Revision ID: 7f4b2c3240f1
Revises: 8863f13b4827
Create Date: 2026-05-30 16:24:02.804204

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f4b2c3240f1'
down_revision: Union[str, None] = '8863f13b4827'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_cities_name", "cities", ["name"])
    op.create_index("ix_routes_origin_id", "routes", ["origin_id"])
    op.create_index("ix_routes_destination_id", "routes", ["destination_id"])
    op.create_index("ix_trips_departure_time", "trips", ["departure_time"])
    op.create_index("ix_trips_route_id", "trips", ["route_id"])
    op.create_index("ix_trips_operator_id", "trips", ["operator_id"])
    op.create_index("ix_bookings_trip_id", "bookings", ["trip_id"])
    op.create_index("ix_bookings_created_at", "bookings", ["created_at"])
    op.create_index("ix_bookings_passenger_phone", "bookings", ["passenger_phone"])
    op.create_index("ix_bookings_booking_code", "bookings", ["booking_code"])


def downgrade() -> None:
    op.drop_index("ix_bookings_booking_code")
    op.drop_index("ix_bookings_passenger_phone")
    op.drop_index("ix_bookings_created_at")
    op.drop_index("ix_bookings_trip_id")
    op.drop_index("ix_trips_operator_id")
    op.drop_index("ix_trips_route_id")
    op.drop_index("ix_trips_departure_time")
    op.drop_index("ix_routes_destination_id")
    op.drop_index("ix_routes_origin_id")
    op.drop_index("ix_cities_name")
