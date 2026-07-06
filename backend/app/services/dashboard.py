from datetime import date, datetime, time, timezone
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import Booking
from app.models.bus_operator import BusOperator
from app.models.user import User
from app.schemas.dashboard import DashboardDto


async def metrics(db: AsyncSession) -> DashboardDto:
    # Real tickets today
    today_start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
    bookings_today = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= today_start)
    )
    tickets_today = bookings_today.scalar() or 0
    
    # Real active buses (operators)
    operators = await db.execute(select(func.count(BusOperator.id)))
    active_buses = operators.scalar() or 0
    
    # Real online users (registered users count)
    users = await db.execute(select(func.count(User.id)))
    online_users = users.scalar() or 0
    
    # Bookings this month (as proxy for recommendations)
    this_month_start = date.today().replace(day=1)
    this_month_start_dt = datetime.combine(this_month_start, time.min, tzinfo=timezone.utc)
    bookings_month = await db.execute(
        select(func.count(Booking.id)).where(Booking.created_at >= this_month_start_dt)
    )
    ai_recommendations = bookings_month.scalar() or 0
    
    # Satisfaction: percentage of paid bookings
    paid_bookings = await db.execute(
        select(func.count(Booking.id)).where(Booking.status == "PAID")
    )
    paid_count = paid_bookings.scalar() or 0
    total_bookings_all = await db.execute(select(func.count(Booking.id)))
    total_count = total_bookings_all.scalar() or 1
    satisfaction = (paid_count / total_count * 100) if total_count > 0 else 0
    
    return DashboardDto(
        tickets_today=tickets_today,
        active_buses=active_buses,
        online_users=online_users,
        ai_recommendations=ai_recommendations,
        satisfaction=round(min(satisfaction, 99.9), 1),
    )
