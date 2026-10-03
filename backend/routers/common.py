from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from models import Registration, SiteSetting
from utils import slugify

REG_LOAD = (selectinload(Registration.payments), selectinload(Registration.package))


async def paginate(db, stmt, page: int, limit: int):
    page = max(page, 1)
    limit = min(max(limit, 1), 200)
    total = await db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = (await db.execute(stmt.offset((page - 1) * limit).limit(limit))).scalars().unique().all()
    return rows, total, {"total": total, "page": page, "limit": limit, "pages": max((total + limit - 1) // limit, 1)}


async def get_settings_map(db) -> dict:
    rows = (await db.execute(select(SiteSetting))).scalars().all()
    return {r.key: (r.value or {}) for r in rows}


async def unique_slug(db, model, base: str, exclude_id: str | None = None) -> str:
    slug = slugify(base)
    candidate, n = slug, 2
    while True:
        stmt = select(model.id).where(model.slug == candidate)
        if exclude_id:
            stmt = stmt.where(model.id != exclude_id)
        if not await db.scalar(stmt):
            return candidate
        candidate = f"{slug}-{n}"
        n += 1


async def get_or_404(db, model, id_: str, options=(), detail="Data tidak ditemukan"):
    stmt = select(model).where(model.id == id_)
    if options:
        stmt = stmt.options(*options)
    obj = (await db.execute(stmt)).scalars().unique().one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail=detail)
    return obj
