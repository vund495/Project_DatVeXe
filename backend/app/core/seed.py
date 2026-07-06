from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models.bus_operator import BusOperator
from app.models.bus_route import BusRoute
from app.models.city import City
from app.models.trip import Trip
from app.models.booking import Booking

# (origin, destination, operator_name, hour, minute, price, total_seats)
TRIP_TEMPLATES = [
    ("Hồ Chí Minh", "Đà Nẵng", "Phương Trang (FUTA Bus Lines)", 8, 0, 450000, 34),
    ("Hồ Chí Minh", "Đà Nẵng", "Phương Trang (FUTA Bus Lines)", 17, 30, 450000, 34),
    ("Hồ Chí Minh", "Đà Nẵng", "Thành Bưởi Limousine", 17, 30, 650000, 24),
    ("Hồ Chí Minh", "Đà Lạt", "Phương Trang (FUTA Bus Lines)", 7, 0, 300000, 34),
    ("Hồ Chí Minh", "Đà Lạt", "Thành Bưởi Limousine", 22, 0, 420000, 24),
    ("Hà Nội", "Hải Phòng", "Hải Vân Express", 9, 30, 220000, 18),
    ("Hà Nội", "Hải Phòng", "Toàn Thắng Limousine", 14, 0, 160000, 9),
    ("Hà Nội", "Sa Pa", "Sao Việt Premium", 6, 30, 320000, 22),
    ("Hà Nội", "Sa Pa", "Hải Vân Express", 22, 0, 450000, 18),
    ("Hồ Chí Minh", "Nha Trang", "Phương Trang (FUTA Bus Lines)", 20, 30, 350000, 34),
    ("Hồ Chí Minh", "Nha Trang", "Thành Bưởi Limousine", 21, 30, 480000, 24),
    ("Hồ Chí Minh", "Vũng Tàu", "Toàn Thắng Limousine", 8, 0, 180000, 9),
    ("Hồ Chí Minh", "Vũng Tàu", "Toàn Thắng Limousine", 11, 0, 180000, 9),
    ("Đà Nẵng", "Hà Nội", "Hải Vân Express", 19, 0, 550000, 18),
    ("Đà Nẵng", "Hà Nội", "Sao Việt Premium", 8, 0, 500000, 22),
]


async def seed_database(db: AsyncSession) -> None:
    existing = await db.execute(select(City).limit(1))
    if existing.scalar_one_or_none():
        return

    hcm = City(name="Hồ Chí Minh", region="Miền Nam")
    da_nang = City(name="Đà Nẵng", region="Miền Trung")
    da_lat = City(name="Đà Lạt", region="Tây Nguyên")
    ha_noi = City(name="Hà Nội", region="Miền Bắc")
    hai_phong = City(name="Hải Phòng", region="Miền Bắc")
    can_tho = City(name="Cần Thơ", region="Miền Tây")
    nha_trang = City(name="Nha Trang", region="Duyên hải Nam Trung Bộ")
    sa_pa = City(name="Sa Pa", region="Miền Bắc")
    vung_tau = City(name="Vũng Tàu", region="Miền Nam")

    db.add_all([hcm, da_nang, da_lat, ha_noi, hai_phong, can_tho, nha_trang, sa_pa, vung_tau])
    await db.flush()

    futa = BusOperator(name="Phương Trang (FUTA Bus Lines)", rating=4.8, bus_type="Sleeper 34", badge="AN TOÀN")
    thanh_buoi = BusOperator(name="Thành Bưởi Limousine", rating=4.9, bus_type="Cabin 24", badge="SANG TRỌNG")
    sao_viet = BusOperator(name="Sao Việt Premium", rating=4.7, bus_type="Limousine 22", badge="TỐC HÀNH")
    hai_van = BusOperator(name="Hải Vân Express", rating=4.8, bus_type="Luxury 18", badge="UY TÍN")
    toan_thang = BusOperator(name="Toàn Thắng Limousine", rating=4.6, bus_type="Limousine 9", badge="NHANH CHÓNG")

    db.add_all([futa, thanh_buoi, sao_viet, hai_van, toan_thang])
    await db.flush()

    routes = [
        BusRoute(origin_id=hcm.id, destination_id=da_nang.id, distance_km=1080, duration_minutes=1080, badge="HOT"),
        BusRoute(origin_id=hcm.id, destination_id=da_lat.id, distance_km=420, duration_minutes=420, badge="PHỔ BIẾN"),
        BusRoute(origin_id=ha_noi.id, destination_id=hai_phong.id, distance_km=120, duration_minutes=120, badge="VIP"),
        BusRoute(origin_id=ha_noi.id, destination_id=sa_pa.id, distance_km=360, duration_minutes=360, badge="DU LỊCH"),
        BusRoute(origin_id=hcm.id, destination_id=nha_trang.id, distance_km=480, duration_minutes=480, badge="BIỂN ĐẸP"),
        BusRoute(origin_id=hcm.id, destination_id=vung_tau.id, distance_km=150, duration_minutes=150, badge="TỐC HÀNH"),
        BusRoute(origin_id=da_nang.id, destination_id=ha_noi.id, distance_km=840, duration_minutes=840, badge="NIGHT"),
    ]
    db.add_all(routes)


async def ensure_upcoming_trips(db: AsyncSession, days_ahead: int = 14) -> None:
    origin_alias = aliased(City)
    dest_alias = aliased(City)
    routes_rs = await db.execute(
        select(BusRoute, origin_alias.name, dest_alias.name)
        .join(origin_alias, BusRoute.origin_id == origin_alias.id)
        .join(dest_alias, BusRoute.destination_id == dest_alias.id)
    )
    route_map = {}
    for route, origin_name, dest_name in routes_rs:
        route_map[(origin_name, dest_name)] = route

    op_rs = await db.execute(select(BusOperator))
    operator_map = {op.name: op for op in op_rs.scalars().all()}

    today = date.today()
    cutoff = datetime.combine(today, time.min, tzinfo=timezone.utc)
    end = cutoff + timedelta(days=days_ahead + 1)

    existing = await db.execute(
        select(Trip.route_id, Trip.operator_id, Trip.departure_time)
        .where(Trip.departure_time >= cutoff)
        .where(Trip.departure_time < end)
    )
    existing_set = {(r, o, d) for r, o, d in existing}

    new_trips = []
    for day_offset in range(days_ahead + 1):
        d = today + timedelta(days=day_offset)
        for origin_name, dest_name, op_name, h, m, price, seats in TRIP_TEMPLATES:
            route = route_map.get((origin_name, dest_name))
            operator = operator_map.get(op_name)
            if not route or not operator:
                continue

            dep_time = datetime.combine(d, time(h, m), tzinfo=timezone.utc)

            if (route.id, operator.id, dep_time) in existing_set:
                continue

            arr_time = dep_time + timedelta(minutes=route.duration_minutes)
            new_trips.append(Trip(
                route_id=route.id,
                operator_id=operator.id,
                departure_time=dep_time,
                arrival_time=arr_time,
                price=Decimal(price),
                total_seats=seats,
                booked_seats=0,
            ))

    db.add_all(new_trips)

    old_ids_rs = await db.execute(
        select(Trip.id).where(Trip.departure_time < cutoff)
    )
    old_ids = [row[0] for row in old_ids_rs]
    if old_ids:
        booked_rs = await db.execute(
            select(Booking.trip_id).where(Booking.trip_id.in_(old_ids)).distinct()
        )
        booked_ids = {row[0] for row in booked_rs}
        to_delete = [tid for tid in old_ids if tid not in booked_ids]
        if to_delete:
            await db.execute(delete(Trip).where(Trip.id.in_(to_delete)))
