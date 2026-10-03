from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import current_admin, touch_login
from database import get_db
from models import AdminUser, ContactMessage, Customer, Package, Payment, Registration
from routers.common import REG_LOAD
from serializers import serialize_registration
from utils import SEAT_COUNTING_STATUSES, now_utc, row_to_dict

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(current_admin)])


@router.get("/me")
async def me(admin: AdminUser = Depends(current_admin), db: AsyncSession = Depends(get_db)):
    await touch_login(admin, db)
    return row_to_dict(admin)


@router.get("/dashboard")
async def dashboard(db: AsyncSession = Depends(get_db)):
    active_filter = (Package.is_active.is_(True), Package.is_published.is_(True))
    total_packages = await db.scalar(select(func.count(Package.id))) or 0
    active_packages = await db.scalar(select(func.count(Package.id)).where(*active_filter)) or 0
    total_customers = await db.scalar(select(func.count(Customer.id))) or 0
    total_registrations = await db.scalar(select(func.count(Registration.id))) or 0
    new_registrations = await db.scalar(select(func.count(Registration.id)).where(Registration.status == "NEW")) or 0
    payments_total = await db.scalar(select(func.coalesce(func.sum(Payment.amount), 0))) or 0
    payments_count = await db.scalar(select(func.count(Payment.id))) or 0
    quota = (await db.execute(select(func.coalesce(func.sum(Package.total_seats), 0), func.coalesce(func.sum(Package.seats_filled), 0)).where(*active_filter))).one()
    committed = await db.scalar(select(func.coalesce(func.sum(Registration.package_price), 0)).where(Registration.status.in_(SEAT_COUNTING_STATUSES))) or 0
    paid_committed = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).join(Registration, Payment.registration_id == Registration.id).where(Registration.status.in_(SEAT_COUNTING_STATUSES))
    ) or 0
    new_messages = await db.scalar(select(func.count(ContactMessage.id)).where(ContactMessage.status == "NEW")) or 0

    since = now_utc() - timedelta(days=29)
    day_rows = (await db.execute(
        select(func.date(Registration.registered_at).label("d"), func.count(Registration.id)).where(Registration.registered_at >= since).group_by("d").order_by("d")
    )).all()
    counts_by_day = {str(d): c for d, c in day_rows}
    series = [{"date": (date.today() - timedelta(days=i)).isoformat()} for i in range(29, -1, -1)]
    for s in series:
        s["count"] = counts_by_day.get(s["date"], 0)

    popularity = (await db.execute(
        select(Registration.package_name, func.count(Registration.id).label("c")).group_by(Registration.package_name).order_by(func.count(Registration.id).desc()).limit(6)
    )).all()
    pay_status = (await db.execute(select(Registration.payment_status, func.count(Registration.id)).group_by(Registration.payment_status))).all()
    reg_status = (await db.execute(select(Registration.status, func.count(Registration.id)).group_by(Registration.status))).all()
    monthly = (await db.execute(
        select(func.to_char(Payment.payment_date, "YYYY-MM").label("m"), func.sum(Payment.amount)).group_by("m").order_by("m").limit(12)
    )).all()
    quota_rows = (await db.execute(
        select(Package.name, Package.total_seats, Package.seats_filled, Package.departure_date).where(*active_filter).order_by(Package.departure_date.asc().nulls_last()).limit(8)
    )).all()
    recent = (await db.execute(select(Registration).options(*REG_LOAD).order_by(Registration.registered_at.desc()).limit(8))).scalars().unique().all()
    upcoming = (await db.execute(
        select(Package).where(*active_filter, Package.departure_date >= date.today()).order_by(Package.departure_date.asc()).limit(5)
    )).scalars().unique().all()

    return {
        "cards": {
            "total_packages": total_packages, "active_packages": active_packages, "total_customers": total_customers,
            "total_registrations": total_registrations, "new_registrations": new_registrations,
            "payments_total": float(payments_total), "payments_count": payments_count,
            "outstanding": float(Decimal(committed) - Decimal(paid_committed)),
            "quota_total": int(quota[0]), "quota_filled": int(quota[1]), "quota_remaining": max(int(quota[0]) - int(quota[1]), 0),
            "new_messages": new_messages,
        },
        "registrations_over_time": series,
        "package_popularity": [{"name": n or "(tanpa paket)", "count": c} for n, c in popularity],
        "payment_status": [{"status": s, "count": c} for s, c in pay_status],
        "registration_status": [{"status": s, "count": c} for s, c in reg_status],
        "payments_monthly": [{"month": m, "total": float(t or 0)} for m, t in monthly],
        "quota_utilization": [{"name": n, "total": t or 0, "filled": f or 0, "departure_date": d.isoformat() if d else None} for n, t, f, d in quota_rows],
        "recent_registrations": [serialize_registration(r) for r in recent],
        "upcoming_departures": [{"id": p.id, "name": p.name, "slug": p.slug, "departure_date": p.departure_date.isoformat(), "remaining": max((p.total_seats or 0) - (p.seats_filled or 0), 0), "total_seats": p.total_seats} for p in upcoming],
    }
