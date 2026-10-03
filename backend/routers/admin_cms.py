from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import current_admin
from database import get_db
from models import AdminUser, Faq, HomepageSection, SiteSetting, Testimonial
from routers.common import get_or_404, get_settings_map
from schemas import AdminUserIn, AdminUserUpdate, FaqIn, HomepageSectionIn, ReorderIn, SettingIn, TestimonialIn
from storage import client as sb_client
from utils import now_utc, row_to_dict

router = APIRouter(prefix="/api/admin", tags=["admin-cms"], dependencies=[Depends(current_admin)])

SETTING_KEYS = {"brand", "theme", "contact", "social", "seo", "legal", "whatsapp", "footer", "about", "general"}


# ---------- Settings ----------
@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    return await get_settings_map(db)


@router.put("/settings/{key}")
async def put_setting(key: str, payload: SettingIn, db: AsyncSession = Depends(get_db)):
    if key not in SETTING_KEYS:
        raise HTTPException(status_code=400, detail="Kunci pengaturan tidak dikenal")
    row = await db.get(SiteSetting, key)
    if row:
        row.value = {**(row.value or {}), **payload.value}
        row.updated_at = now_utc()
    else:
        row = SiteSetting(key=key, value=payload.value)
        db.add(row)
    await db.commit()
    return {"key": key, "value": row.value}


# ---------- Homepage sections ----------
@router.get("/homepage-sections")
async def list_sections(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(HomepageSection).order_by(HomepageSection.sort_order))).scalars().all()
    return [row_to_dict(s) for s in rows]


@router.patch("/homepage-sections/reorder")
async def reorder_sections(payload: ReorderIn, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(HomepageSection).where(HomepageSection.id.in_(payload.ids)))).scalars().all()
    pos = {id_: i for i, id_ in enumerate(payload.ids)}
    for r in rows:
        r.sort_order = pos[r.id]
    await db.commit()
    return {"ok": True}


@router.put("/homepage-sections/{key}")
async def put_section(key: str, payload: HomepageSectionIn, db: AsyncSession = Depends(get_db)):
    row = await db.scalar(select(HomepageSection).where(HomepageSection.key == key))
    if not row:
        max_order = await db.scalar(select(func.coalesce(func.max(HomepageSection.sort_order), 0)))
        row = HomepageSection(key=key, sort_order=max_order + 1)
        db.add(row)
    row.title = payload.title
    row.subtitle = payload.subtitle
    row.content = payload.content
    row.is_active = payload.is_active
    if payload.sort_order is not None:
        row.sort_order = payload.sort_order
    await db.commit()
    return row_to_dict(row)


# ---------- FAQs ----------
@router.get("/faqs")
async def list_faqs(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Faq).where(Faq.package_id.is_(None)).order_by(Faq.sort_order))).scalars().all()
    return [row_to_dict(f) for f in rows]


@router.post("/faqs", status_code=201)
async def create_faq(payload: FaqIn, db: AsyncSession = Depends(get_db)):
    max_order = await db.scalar(select(func.coalesce(func.max(Faq.sort_order), -1)).where(Faq.package_id.is_(None)))
    f = Faq(**payload.model_dump(exclude={"sort_order", "package_id"}), sort_order=max_order + 1)
    db.add(f)
    await db.commit()
    return row_to_dict(f)


@router.patch("/faqs/reorder")
async def reorder_faqs(payload: ReorderIn, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Faq).where(Faq.id.in_(payload.ids)))).scalars().all()
    pos = {id_: i for i, id_ in enumerate(payload.ids)}
    for r in rows:
        r.sort_order = pos[r.id]
    await db.commit()
    return {"ok": True}


@router.put("/faqs/{faq_id}")
async def update_faq(faq_id: str, payload: FaqIn, db: AsyncSession = Depends(get_db)):
    f = await get_or_404(db, Faq, faq_id)
    for k, v in payload.model_dump(exclude={"package_id"}).items():
        setattr(f, k, v)
    await db.commit()
    return row_to_dict(f)


@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, db: AsyncSession = Depends(get_db)):
    f = await get_or_404(db, Faq, faq_id)
    await db.delete(f)
    await db.commit()
    return {"ok": True}


# ---------- Testimonials ----------
@router.get("/testimonials")
async def list_testimonials(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Testimonial).order_by(Testimonial.sort_order))).scalars().all()
    return [row_to_dict(t) for t in rows]


@router.post("/testimonials", status_code=201)
async def create_testimonial(payload: TestimonialIn, db: AsyncSession = Depends(get_db)):
    max_order = await db.scalar(select(func.coalesce(func.max(Testimonial.sort_order), -1)))
    t = Testimonial(**payload.model_dump(exclude={"sort_order"}), sort_order=max_order + 1)
    db.add(t)
    await db.commit()
    return row_to_dict(t)


@router.patch("/testimonials/reorder")
async def reorder_testimonials(payload: ReorderIn, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Testimonial).where(Testimonial.id.in_(payload.ids)))).scalars().all()
    pos = {id_: i for i, id_ in enumerate(payload.ids)}
    for r in rows:
        r.sort_order = pos[r.id]
    await db.commit()
    return {"ok": True}


@router.put("/testimonials/{t_id}")
async def update_testimonial(t_id: str, payload: TestimonialIn, db: AsyncSession = Depends(get_db)):
    t = await get_or_404(db, Testimonial, t_id)
    for k, v in payload.model_dump().items():
        setattr(t, k, v)
    await db.commit()
    return row_to_dict(t)


@router.delete("/testimonials/{t_id}")
async def delete_testimonial(t_id: str, db: AsyncSession = Depends(get_db)):
    t = await get_or_404(db, Testimonial, t_id)
    await db.delete(t)
    await db.commit()
    return {"ok": True}


# ---------- Admin accounts ----------
@router.get("/admin-users")
async def list_admins(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(AdminUser).order_by(AdminUser.created_at))).scalars().all()
    return [row_to_dict(a) for a in rows]


@router.post("/admin-users", status_code=201)
async def create_admin(payload: AdminUserIn, db: AsyncSession = Depends(get_db)):
    email = payload.email.lower()
    if await db.scalar(select(AdminUser).where(AdminUser.email == email)):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar sebagai admin")
    auth_id = None
    if payload.password:
        def _create():
            return sb_client().auth.admin.create_user({"email": email, "password": payload.password, "email_confirm": True, "user_metadata": {"is_admin": True}})
        try:
            res = await run_in_threadpool(_create)
            auth_id = res.user.id if res and res.user else None
        except Exception as exc:
            if "already" not in str(exc).lower():
                raise HTTPException(status_code=400, detail=f"Gagal membuat akun login: {exc}")
    admin = AdminUser(email=email, full_name=payload.full_name, auth_user_id=auth_id, role="SUPER_ADMIN", is_active=True)
    db.add(admin)
    await db.commit()
    return row_to_dict(admin)


@router.patch("/admin-users/{admin_id}")
async def update_admin(admin_id: str, payload: AdminUserUpdate, me: AdminUser = Depends(current_admin), db: AsyncSession = Depends(get_db)):
    a = await get_or_404(db, AdminUser, admin_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("is_active") is False and a.id == me.id:
        raise HTTPException(status_code=400, detail="Tidak dapat menonaktifkan akun sendiri")
    for k, v in data.items():
        setattr(a, k, v)
    await db.commit()
    return row_to_dict(a)


@router.delete("/admin-users/{admin_id}")
async def delete_admin(admin_id: str, me: AdminUser = Depends(current_admin), db: AsyncSession = Depends(get_db)):
    a = await get_or_404(db, AdminUser, admin_id)
    if a.id == me.id:
        raise HTTPException(status_code=400, detail="Tidak dapat menghapus akun sendiri")
    if a.auth_user_id:
        try:
            await run_in_threadpool(lambda: sb_client().auth.admin.delete_user(a.auth_user_id))
        except Exception:
            pass
    await db.delete(a)
    await db.commit()
    return {"ok": True}
