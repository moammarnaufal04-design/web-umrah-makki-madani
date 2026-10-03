from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from auth import current_admin
from database import get_db
from models import AdminUser, ContactMessage, Customer, NewsletterSubscriber, Package, Payment, Registration
from routers.common import REG_LOAD, get_or_404, paginate
from schemas import (
    ContactStatusIn, CustomerUpdate, PaymentIn, PaymentUpdate, RegistrationAdminCreate, RegistrationBulkIn, RegistrationUpdate,
)
from serializers import serialize_registration
from utils import SEAT_COUNTING_STATUSES, compute_payment_status, normalize_wa, now_utc, row_to_dict, rows_to_csv, rows_to_xlsx, short_code

router = APIRouter(prefix="/api/admin", tags=["admin-customers"], dependencies=[Depends(current_admin)])


def registrations_query(q, status, payment_status, document_status, package_id, date_from, date_to):
    stmt = select(Registration).options(*REG_LOAD)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Registration.full_name.ilike(like), Registration.whatsapp.ilike(like), Registration.email.ilike(like), Registration.code.ilike(like), Registration.package_name.ilike(like)))
    if status:
        stmt = stmt.where(Registration.status == status)
    if payment_status:
        stmt = stmt.where(Registration.payment_status == payment_status)
    if document_status:
        stmt = stmt.where(Registration.document_status == document_status)
    if package_id:
        stmt = stmt.where(Registration.package_id == package_id)
    if date_from:
        stmt = stmt.where(Registration.registered_at >= datetime.fromisoformat(date_from))
    if date_to:
        stmt = stmt.where(Registration.registered_at <= datetime.fromisoformat(date_to + "T23:59:59"))
    return stmt


async def adjust_seats(db, package_id, old_status, new_status):
    if not package_id or old_status == new_status:
        return
    was, now = old_status in SEAT_COUNTING_STATUSES, new_status in SEAT_COUNTING_STATUSES
    if was == now:
        return
    pkg = await db.get(Package, package_id)
    if pkg:
        pkg.seats_filled = (pkg.seats_filled or 0) + 1 if now else max((pkg.seats_filled or 0) - 1, 0)


async def recompute_payment_status(db, reg: Registration):
    paid = await db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.registration_id == reg.id)) or 0
    reg.payment_status = compute_payment_status(reg.package_price, reg.dp_amount, paid)


# ---------- Registrations ----------
@router.get("/registrations")
async def list_registrations(
    q: str | None = None, status: str | None = None, payment_status: str | None = None, document_status: str | None = None,
    package_id: str | None = None, date_from: str | None = None, date_to: str | None = None,
    sort: str = "registered_at", order: str = "desc", page: int = 1, limit: int = Query(20, le=200), db: AsyncSession = Depends(get_db),
):
    stmt = registrations_query(q, status, payment_status, document_status, package_id, date_from, date_to)
    sortable = {"registered_at": Registration.registered_at, "full_name": Registration.full_name, "status": Registration.status, "payment_status": Registration.payment_status, "package_name": Registration.package_name}
    col = sortable.get(sort, Registration.registered_at)
    stmt = stmt.order_by(col.desc() if order == "desc" else col.asc())
    rows, total, meta = await paginate(db, stmt, page, limit)
    return {"items": [serialize_registration(r) for r in rows], **meta}


@router.post("/registrations", status_code=201)
async def admin_create_registration(payload: RegistrationAdminCreate, db: AsyncSession = Depends(get_db)):
    pkg = await get_or_404(db, Package, payload.package_id, detail="Paket tidak ditemukan")
    wa = normalize_wa(payload.whatsapp)
    customer = await db.scalar(select(Customer).where(Customer.whatsapp == wa))
    if not customer:
        customer = Customer(full_name=payload.full_name, gender=payload.gender, address=payload.address, whatsapp=wa, email=payload.email)
        db.add(customer)
        await db.flush()
    reg = Registration(
        code=short_code("MM"), customer_id=customer.id, package_id=pkg.id, package_name=pkg.name, package_price=pkg.price, dp_amount=pkg.dp_amount,
        full_name=payload.full_name, gender=payload.gender, address=payload.address, whatsapp=wa, email=payload.email,
        status=payload.status, admin_notes=payload.admin_notes, source_page="admin", registered_at=now_utc(),
    )
    db.add(reg)
    await adjust_seats(db, pkg.id, "NEW", payload.status)
    await db.commit()
    reg = await get_or_404(db, Registration, reg.id, REG_LOAD)
    return serialize_registration(reg, with_payments=True)


@router.post("/registrations/bulk")
async def bulk_registrations(payload: RegistrationBulkIn, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Registration).where(Registration.id.in_(payload.ids)))).scalars().unique().all()
    for r in rows:
        if payload.action == "delete":
            await adjust_seats(db, r.package_id, r.status, "CANCELLED")
            await db.delete(r)
        elif payload.action == "set_status" and payload.status:
            await adjust_seats(db, r.package_id, r.status, payload.status)
            r.status = payload.status
    await db.commit()
    return {"ok": True, "affected": len(rows)}


@router.get("/registrations/{reg_id}")
async def get_registration(reg_id: str, db: AsyncSession = Depends(get_db)):
    reg = await get_or_404(db, Registration, reg_id, REG_LOAD, detail="Pendaftaran tidak ditemukan")
    return serialize_registration(reg, with_payments=True)


@router.patch("/registrations/{reg_id}")
async def update_registration(reg_id: str, payload: RegistrationUpdate, db: AsyncSession = Depends(get_db)):
    reg = await get_or_404(db, Registration, reg_id, REG_LOAD, detail="Pendaftaran tidak ditemukan")
    data = payload.model_dump(exclude_unset=True)
    if "package_id" in data and data["package_id"] and data["package_id"] != reg.package_id:
        pkg = await get_or_404(db, Package, data["package_id"], detail="Paket tidak ditemukan")
        await adjust_seats(db, reg.package_id, reg.status, "CANCELLED")
        await adjust_seats(db, pkg.id, "NEW", data.get("status", reg.status))
        reg.package_id, reg.package_name, reg.package_price, reg.dp_amount = pkg.id, pkg.name, pkg.price, pkg.dp_amount
        data.pop("package_id")
    if "status" in data and data["status"] != reg.status:
        await adjust_seats(db, reg.package_id, reg.status, data["status"])
    if "whatsapp" in data and data["whatsapp"]:
        data["whatsapp"] = normalize_wa(data["whatsapp"])
    manual_payment = "payment_status" in data
    for k, v in data.items():
        setattr(reg, k, v)
    if reg.customer:
        for k in ("full_name", "gender", "address", "email"):
            if k in data and data[k]:
                setattr(reg.customer, k, data[k])
    if not manual_payment and ("package_price" in data or "dp_amount" in data):
        await recompute_payment_status(db, reg)
    await db.commit()
    db.expunge_all()
    reg = await get_or_404(db, Registration, reg_id, REG_LOAD)
    return serialize_registration(reg, with_payments=True)


@router.delete("/registrations/{reg_id}")
async def delete_registration(reg_id: str, db: AsyncSession = Depends(get_db)):
    reg = await get_or_404(db, Registration, reg_id, detail="Pendaftaran tidak ditemukan")
    await adjust_seats(db, reg.package_id, reg.status, "CANCELLED")
    await db.delete(reg)
    await db.commit()
    return {"ok": True}


# ---------- Customers ----------
CUSTOMER_LOAD = (selectinload(Customer.registrations).selectinload(Registration.payments), selectinload(Customer.registrations).selectinload(Registration.package))


@router.get("/customers")
async def list_customers(q: str | None = None, sort: str = "created_at", order: str = "desc", page: int = 1, limit: int = Query(20, le=200), db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).options(*CUSTOMER_LOAD)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Customer.full_name.ilike(like), Customer.whatsapp.ilike(like), Customer.email.ilike(like), Customer.address.ilike(like)))
    col = {"created_at": Customer.created_at, "full_name": Customer.full_name}.get(sort, Customer.created_at)
    stmt = stmt.order_by(col.desc() if order == "desc" else col.asc())
    rows, total, meta = await paginate(db, stmt, page, limit)
    items = []
    for c in rows:
        d = row_to_dict(c)
        d["registration_count"] = len(c.registrations)
        d["latest_registration"] = serialize_registration(max(c.registrations, key=lambda r: r.registered_at)) if c.registrations else None
        d["total_paid"] = float(sum((Decimal(p.amount) for r in c.registrations for p in r.payments), Decimal(0)))
        items.append(d)
    return {"items": items, **meta}


@router.get("/customers/{cust_id}")
async def get_customer(cust_id: str, db: AsyncSession = Depends(get_db)):
    c = await get_or_404(db, Customer, cust_id, CUSTOMER_LOAD, detail="Jamaah tidak ditemukan")
    d = row_to_dict(c)
    d["registrations"] = [serialize_registration(r, with_payments=True) for r in sorted(c.registrations, key=lambda r: r.registered_at, reverse=True)]
    return d


@router.patch("/customers/{cust_id}")
async def update_customer(cust_id: str, payload: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    c = await get_or_404(db, Customer, cust_id, detail="Jamaah tidak ditemukan")
    data = payload.model_dump(exclude_unset=True)
    if "whatsapp" in data and data["whatsapp"]:
        data["whatsapp"] = normalize_wa(data["whatsapp"])
        dup = await db.scalar(select(Customer).where(Customer.whatsapp == data["whatsapp"], Customer.id != cust_id))
        if dup:
            raise HTTPException(status_code=409, detail="Nomor WhatsApp sudah digunakan jamaah lain")
    for k, v in data.items():
        setattr(c, k, v)
    await db.commit()
    return row_to_dict(c)


@router.delete("/customers/{cust_id}")
async def delete_customer(cust_id: str, db: AsyncSession = Depends(get_db)):
    c = await get_or_404(db, Customer, cust_id, CUSTOMER_LOAD, detail="Jamaah tidak ditemukan")
    for r in c.registrations:
        await adjust_seats(db, r.package_id, r.status, "CANCELLED")
    await db.delete(c)
    await db.commit()
    return {"ok": True}


# ---------- Payments ----------
def serialize_payment(p: Payment):
    d = row_to_dict(p)
    r = p.registration
    d["registration"] = {"code": r.code, "full_name": r.full_name, "package_name": r.package_name, "package_price": float(r.package_price or 0), "payment_status": r.payment_status} if r else None
    return d


@router.get("/payments")
async def list_payments(q: str | None = None, registration_id: str | None = None, date_from: str | None = None, date_to: str | None = None, page: int = 1, limit: int = Query(20, le=200), db: AsyncSession = Depends(get_db)):
    stmt = select(Payment).options(selectinload(Payment.registration)).join(Registration, Payment.registration_id == Registration.id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Registration.full_name.ilike(like), Registration.code.ilike(like), Registration.package_name.ilike(like), Payment.reference.ilike(like)))
    if registration_id:
        stmt = stmt.where(Payment.registration_id == registration_id)
    if date_from:
        stmt = stmt.where(Payment.payment_date >= date.fromisoformat(date_from))
    if date_to:
        stmt = stmt.where(Payment.payment_date <= date.fromisoformat(date_to))
    stmt = stmt.order_by(Payment.payment_date.desc(), Payment.created_at.desc())
    rows, total, meta = await paginate(db, stmt, page, limit)
    return {"items": [serialize_payment(p) for p in rows], **meta}


@router.get("/payments/summary")
async def payments_summary(db: AsyncSession = Depends(get_db)):
    total_paid = await db.scalar(select(func.coalesce(func.sum(Payment.amount), 0))) or 0
    committed = await db.scalar(select(func.coalesce(func.sum(Registration.package_price), 0)).where(Registration.status.in_(SEAT_COUNTING_STATUSES))) or 0
    paid_committed = await db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).join(Registration, Payment.registration_id == Registration.id).where(Registration.status.in_(SEAT_COUNTING_STATUSES))) or 0
    by_status = (await db.execute(select(Registration.payment_status, func.count(Registration.id)).group_by(Registration.payment_status))).all()
    return {"total_paid": float(total_paid), "committed": float(committed), "outstanding": float(Decimal(committed) - Decimal(paid_committed)), "by_status": {s: c for s, c in by_status}}


@router.post("/payments", status_code=201)
async def create_payment(payload: PaymentIn, admin: AdminUser = Depends(current_admin), db: AsyncSession = Depends(get_db)):
    reg = await get_or_404(db, Registration, payload.registration_id, detail="Pendaftaran tidak ditemukan")
    pay = Payment(registration_id=reg.id, customer_id=reg.customer_id, package_id=reg.package_id, amount=payload.amount, payment_date=payload.payment_date, method=payload.method, reference=payload.reference, notes=payload.notes, recorded_by=admin.email)
    db.add(pay)
    await db.flush()
    await recompute_payment_status(db, reg)
    await db.commit()
    pay = await get_or_404(db, Payment, pay.id, (selectinload(Payment.registration),))
    return serialize_payment(pay)


@router.patch("/payments/{pay_id}")
async def update_payment(pay_id: str, payload: PaymentUpdate, db: AsyncSession = Depends(get_db)):
    pay = await get_or_404(db, Payment, pay_id, (selectinload(Payment.registration),), detail="Pembayaran tidak ditemukan")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(pay, k, v)
    await db.flush()
    await recompute_payment_status(db, pay.registration)
    await db.commit()
    return serialize_payment(pay)


@router.delete("/payments/{pay_id}")
async def delete_payment(pay_id: str, db: AsyncSession = Depends(get_db)):
    pay = await get_or_404(db, Payment, pay_id, (selectinload(Payment.registration),), detail="Pembayaran tidak ditemukan")
    reg = pay.registration
    await db.delete(pay)
    await db.flush()
    await recompute_payment_status(db, reg)
    await db.commit()
    return {"ok": True}


# ---------- Contact messages & newsletter ----------
@router.get("/contact-messages")
async def list_messages(status: str | None = None, page: int = 1, limit: int = Query(20, le=200), db: AsyncSession = Depends(get_db)):
    stmt = select(ContactMessage)
    if status:
        stmt = stmt.where(ContactMessage.status == status)
    rows, total, meta = await paginate(db, stmt.order_by(ContactMessage.created_at.desc()), page, limit)
    return {"items": [row_to_dict(m) for m in rows], **meta}


@router.patch("/contact-messages/{msg_id}")
async def update_message(msg_id: str, payload: ContactStatusIn, db: AsyncSession = Depends(get_db)):
    m = await get_or_404(db, ContactMessage, msg_id)
    m.status = payload.status
    await db.commit()
    return row_to_dict(m)


@router.delete("/contact-messages/{msg_id}")
async def delete_message(msg_id: str, db: AsyncSession = Depends(get_db)):
    m = await get_or_404(db, ContactMessage, msg_id)
    await db.delete(m)
    await db.commit()
    return {"ok": True}


@router.get("/newsletter")
async def list_subscribers(page: int = 1, limit: int = Query(50, le=500), db: AsyncSession = Depends(get_db)):
    rows, total, meta = await paginate(db, select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc()), page, limit)
    return {"items": [row_to_dict(s) for s in rows], **meta}


@router.delete("/newsletter/{sub_id}")
async def delete_subscriber(sub_id: str, db: AsyncSession = Depends(get_db)):
    s = await get_or_404(db, NewsletterSubscriber, sub_id)
    await db.delete(s)
    await db.commit()
    return {"ok": True}


# ---------- Exports ----------
GENDER = {"MALE": "Laki-laki", "FEMALE": "Perempuan"}


def export_response(rows, columns, fmt, name):
    stamp = now_utc().strftime("%Y%m%d-%H%M")
    if fmt == "xlsx":
        return Response(rows_to_xlsx(rows, columns, name), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="{name}-{stamp}.xlsx"'})
    return Response(rows_to_csv(rows, columns), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="{name}-{stamp}.csv"'})


@router.get("/export/registrations")
async def export_registrations(format: str = "csv", q: str | None = None, status: str | None = None, payment_status: str | None = None, document_status: str | None = None, package_id: str | None = None, date_from: str | None = None, date_to: str | None = None, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(registrations_query(q, status, payment_status, document_status, package_id, date_from, date_to).order_by(Registration.registered_at.desc()))).scalars().unique().all()
    data = []
    for r in rows:
        d = serialize_registration(r)
        d["gender_label"] = GENDER.get(r.gender, r.gender)
        d["registered_at"] = r.registered_at.strftime("%Y-%m-%d %H:%M")
        data.append(d)
    columns = [("code", "Kode"), ("registered_at", "Tanggal Daftar"), ("full_name", "Nama Lengkap"), ("gender_label", "Jenis Kelamin"), ("whatsapp", "WhatsApp"), ("email", "Email"), ("address", "Alamat"), ("package_name", "Paket"), ("package_price", "Harga Paket"), ("dp_amount", "DP"), ("total_paid", "Total Dibayar"), ("remaining_balance", "Sisa"), ("status", "Status Pendaftaran"), ("document_status", "Status Dokumen"), ("payment_status", "Status Pembayaran"), ("plan_month", "Rencana"), ("notes", "Catatan Jamaah"), ("admin_notes", "Catatan Admin"), ("source_page", "Sumber")]
    return export_response(data, columns, format, "pendaftaran")


@router.get("/export/customers")
async def export_customers(format: str = "csv", q: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Customer).options(*CUSTOMER_LOAD)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Customer.full_name.ilike(like), Customer.whatsapp.ilike(like), Customer.email.ilike(like)))
    rows = (await db.execute(stmt.order_by(Customer.created_at.desc()))).scalars().unique().all()
    data = []
    for c in rows:
        d = row_to_dict(c)
        d["gender_label"] = GENDER.get(c.gender, c.gender)
        d["registration_count"] = len(c.registrations)
        d["packages"] = "; ".join(sorted({r.package_name or "" for r in c.registrations}))
        d["total_paid"] = float(sum((Decimal(p.amount) for r in c.registrations for p in r.payments), Decimal(0)))
        d["created_at"] = c.created_at.strftime("%Y-%m-%d")
        data.append(d)
    columns = [("full_name", "Nama Lengkap"), ("gender_label", "Jenis Kelamin"), ("whatsapp", "WhatsApp"), ("email", "Email"), ("address", "Alamat"), ("registration_count", "Jumlah Pendaftaran"), ("packages", "Paket"), ("total_paid", "Total Dibayar"), ("notes", "Catatan"), ("created_at", "Terdaftar Sejak")]
    return export_response(data, columns, format, "jamaah")


@router.get("/export/payments")
async def export_payments(format: str = "csv", date_from: str | None = None, date_to: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Payment).options(selectinload(Payment.registration))
    if date_from:
        stmt = stmt.where(Payment.payment_date >= date.fromisoformat(date_from))
    if date_to:
        stmt = stmt.where(Payment.payment_date <= date.fromisoformat(date_to))
    rows = (await db.execute(stmt.order_by(Payment.payment_date.desc()))).scalars().all()
    data = []
    for p in rows:
        d = row_to_dict(p)
        d["registration_code"] = p.registration.code if p.registration else ""
        d["full_name"] = p.registration.full_name if p.registration else ""
        d["package_name"] = p.registration.package_name if p.registration else ""
        data.append(d)
    columns = [("payment_date", "Tanggal"), ("registration_code", "Kode Pendaftaran"), ("full_name", "Nama"), ("package_name", "Paket"), ("amount", "Jumlah"), ("method", "Metode"), ("reference", "Referensi"), ("notes", "Catatan"), ("recorded_by", "Dicatat Oleh")]
    return export_response(data, columns, format, "pembayaran")


@router.get("/export/packages")
async def export_packages(format: str = "csv", db: AsyncSession = Depends(get_db)):
    from utils import compute_package_status
    rows = (await db.execute(select(Package).order_by(Package.departure_date.asc().nulls_last()))).scalars().unique().all()
    data = []
    for p in rows:
        d = row_to_dict(p)
        d["category_name"] = p.category.name if p.category else ""
        d["remaining_seats"] = max((p.total_seats or 0) - (p.seats_filled or 0), 0)
        d["public_status"] = compute_package_status(p)
        d["is_published"] = "Ya" if p.is_published else "Tidak"
        d["is_active"] = "Ya" if p.is_active else "Tidak"
        data.append(d)
    columns = [("code", "Kode"), ("name", "Nama Paket"), ("category_name", "Kategori"), ("price", "Harga"), ("dp_amount", "DP"), ("departure_date", "Berangkat"), ("return_date", "Kembali"), ("duration_days", "Durasi (hari)"), ("airline", "Maskapai"), ("route", "Rute"), ("makkah_hotel", "Hotel Makkah"), ("madinah_hotel", "Hotel Madinah"), ("total_seats", "Total Kursi"), ("seats_filled", "Terisi"), ("remaining_seats", "Sisa"), ("public_status", "Status"), ("is_published", "Dipublikasi"), ("is_active", "Aktif")]
    return export_response(data, columns, format, "paket")
