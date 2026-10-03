from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import current_admin
from database import get_db
from models import Faq, Package, PackageCompanion, PackageFacility, PackageGallery, PackageItinerary, ProductCategory
from routers.common import get_or_404, paginate, unique_slug
from schemas import BulkActionIn, CategoryIn, PackageIn, PackageToggleIn, ReorderIn
from serializers import PACKAGE_LOAD, serialize_package, serialize_package_summary
from utils import compute_package_status, row_to_dict, short_code

router = APIRouter(prefix="/api/admin", tags=["admin-catalog"], dependencies=[Depends(current_admin)])


# ---------- Categories ----------
@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ProductCategory).order_by(ProductCategory.group_type, ProductCategory.sort_order, ProductCategory.name))).scalars().all()
    counts = dict((await db.execute(select(Package.category_id, func.count(Package.id)).group_by(Package.category_id))).all())
    return [{**row_to_dict(c), "package_count": counts.get(c.id, 0)} for c in rows]


@router.post("/categories", status_code=201)
async def create_category(payload: CategoryIn, db: AsyncSession = Depends(get_db)):
    slug = await unique_slug(db, ProductCategory, payload.slug or payload.name)
    cat = ProductCategory(**payload.model_dump(exclude={"slug"}), slug=slug)
    db.add(cat)
    await db.commit()
    return row_to_dict(cat)


@router.put("/categories/{cat_id}")
async def update_category(cat_id: str, payload: CategoryIn, db: AsyncSession = Depends(get_db)):
    cat = await get_or_404(db, ProductCategory, cat_id)
    for k, v in payload.model_dump(exclude={"slug"}).items():
        setattr(cat, k, v)
    if payload.slug and payload.slug != cat.slug:
        cat.slug = await unique_slug(db, ProductCategory, payload.slug, cat.id)
    await db.commit()
    return row_to_dict(cat)


@router.patch("/categories/reorder")
async def reorder_categories(payload: ReorderIn, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ProductCategory).where(ProductCategory.id.in_(payload.ids)))).scalars().all()
    pos = {id_: i for i, id_ in enumerate(payload.ids)}
    for r in rows:
        r.sort_order = pos[r.id]
    await db.commit()
    return {"ok": True}


@router.patch("/categories/{cat_id}/toggle")
async def toggle_category(cat_id: str, db: AsyncSession = Depends(get_db)):
    cat = await get_or_404(db, ProductCategory, cat_id)
    cat.is_active = not cat.is_active
    await db.commit()
    return row_to_dict(cat)


@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, db: AsyncSession = Depends(get_db)):
    cat = await get_or_404(db, ProductCategory, cat_id)
    count = await db.scalar(select(func.count(Package.id)).where(Package.category_id == cat_id))
    if count:
        raise HTTPException(status_code=409, detail=f"Kategori masih memiliki {count} paket. Pindahkan atau hapus paket terlebih dahulu.")
    await db.delete(cat)
    await db.commit()
    return {"ok": True}


# ---------- Packages ----------
def apply_children(pkg: Package, payload: PackageIn):
    pkg.itineraries = [PackageItinerary(day_number=i.day_number, title=i.title, description=i.description, sort_order=idx) for idx, i in enumerate(payload.itineraries)]
    pkg.facilities = [PackageFacility(kind="INCLUDED", label=l, sort_order=i) for i, l in enumerate(payload.facilities_included) if l.strip()] + \
        [PackageFacility(kind="EXCLUDED", label=l, sort_order=i) for i, l in enumerate(payload.facilities_excluded) if l.strip()]
    pkg.gallery = [PackageGallery(image_url=g.image_url, caption=g.caption, sort_order=i) for i, g in enumerate(payload.gallery) if g.image_url]
    pkg.companions = [PackageCompanion(name=c.name, title=c.title, bio=c.bio, photo_url=c.photo_url, quote=c.quote, profile_lines=c.profile_lines, sort_order=i) for i, c in enumerate(payload.companions)]
    pkg.faqs = [Faq(question=f.question, answer=f.answer, category="PACKAGE", is_active=f.is_active, sort_order=i) for i, f in enumerate(payload.faqs)]


SCALAR_FIELDS = set(PackageIn.model_fields) - {"slug", "itineraries", "facilities_included", "facilities_excluded", "gallery", "companions", "faqs"}


@router.get("/packages")
async def list_packages(
    q: str | None = None, category_id: str | None = None, group: str | None = None, status: str | None = None,
    published: bool | None = None, active: bool | None = None, featured: bool | None = None,
    sort: str = "created_at", order: str = "desc", page: int = 1, limit: int = Query(20, le=200),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Package).join(ProductCategory, Package.category_id == ProductCategory.id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Package.name.ilike(like), Package.code.ilike(like), ProductCategory.name.ilike(like)))
    if category_id:
        stmt = stmt.where(Package.category_id == category_id)
    if group:
        stmt = stmt.where(ProductCategory.group_type == group.upper())
    if published is not None:
        stmt = stmt.where(Package.is_published.is_(published))
    if active is not None:
        stmt = stmt.where(Package.is_active.is_(active))
    if featured is not None:
        stmt = stmt.where(Package.is_featured.is_(featured))
    sortable = {"created_at": Package.created_at, "name": Package.name, "price": Package.price, "departure_date": Package.departure_date, "total_seats": Package.total_seats, "seats_filled": Package.seats_filled}
    col = sortable.get(sort, Package.created_at)
    stmt = stmt.order_by(col.desc().nulls_last() if order == "desc" else col.asc().nulls_last())
    rows, total, meta = await paginate(db, stmt, page, limit)
    items = [serialize_package_summary(p) for p in rows]
    if status:
        items = [i for i in items if i["public_status"] == status]
    return {"items": items, **meta}


@router.post("/packages", status_code=201)
async def create_package(payload: PackageIn, db: AsyncSession = Depends(get_db)):
    await get_or_404(db, ProductCategory, payload.category_id, detail="Kategori tidak ditemukan")
    data = payload.model_dump(include=SCALAR_FIELDS)
    pkg = Package(**data, slug=await unique_slug(db, Package, payload.slug or payload.name), code=short_code("PKG"))
    apply_children(pkg, payload)
    db.add(pkg)
    await db.commit()
    pkg = await get_or_404(db, Package, pkg.id, PACKAGE_LOAD)
    return serialize_package(pkg)


@router.get("/packages/{pkg_id}")
async def get_package(pkg_id: str, db: AsyncSession = Depends(get_db)):
    pkg = await get_or_404(db, Package, pkg_id, PACKAGE_LOAD, detail="Paket tidak ditemukan")
    return serialize_package(pkg)


@router.put("/packages/{pkg_id}")
async def update_package(pkg_id: str, payload: PackageIn, db: AsyncSession = Depends(get_db)):
    pkg = await get_or_404(db, Package, pkg_id, PACKAGE_LOAD, detail="Paket tidak ditemukan")
    await get_or_404(db, ProductCategory, payload.category_id, detail="Kategori tidak ditemukan")
    for k, v in payload.model_dump(include=SCALAR_FIELDS).items():
        setattr(pkg, k, v)
    if payload.slug and payload.slug != pkg.slug:
        pkg.slug = await unique_slug(db, Package, payload.slug, pkg.id)
    apply_children(pkg, payload)
    await db.commit()
    db.expunge_all()
    pkg = await get_or_404(db, Package, pkg_id, PACKAGE_LOAD)
    return serialize_package(pkg)


@router.patch("/packages/{pkg_id}")
async def quick_update_package(pkg_id: str, payload: PackageToggleIn, db: AsyncSession = Depends(get_db)):
    pkg = await get_or_404(db, Package, pkg_id, PACKAGE_LOAD, detail="Paket tidak ditemukan")
    data = payload.model_dump(exclude_unset=True)
    if "status_override" in data and data["status_override"] in ("", "AUTO"):
        data["status_override"] = None
    for k, v in data.items():
        setattr(pkg, k, v)
    await db.commit()
    return serialize_package(pkg)


@router.delete("/packages/{pkg_id}")
async def delete_package(pkg_id: str, db: AsyncSession = Depends(get_db)):
    pkg = await get_or_404(db, Package, pkg_id, detail="Paket tidak ditemukan")
    await db.delete(pkg)
    await db.commit()
    return {"ok": True}


@router.post("/packages/{pkg_id}/duplicate", status_code=201)
async def duplicate_package(pkg_id: str, db: AsyncSession = Depends(get_db)):
    src = await get_or_404(db, Package, pkg_id, PACKAGE_LOAD, detail="Paket tidak ditemukan")
    data = {c.name: getattr(src, c.name) for c in Package.__table__.columns if c.name not in ("id", "code", "slug", "created_at", "updated_at")}
    data.update(name=f"{src.name} (Salinan)", is_published=False, seats_filled=0)
    dup = Package(**data, slug=await unique_slug(db, Package, f"{src.slug}-salinan"), code=short_code("PKG"))
    dup.itineraries = [PackageItinerary(day_number=i.day_number, title=i.title, description=i.description, sort_order=i.sort_order) for i in src.itineraries]
    dup.facilities = [PackageFacility(kind=f.kind, label=f.label, sort_order=f.sort_order) for f in src.facilities]
    dup.gallery = [PackageGallery(image_url=g.image_url, caption=g.caption, sort_order=g.sort_order) for g in src.gallery]
    dup.companions = [PackageCompanion(name=c.name, title=c.title, bio=c.bio, photo_url=c.photo_url, quote=c.quote, profile_lines=c.profile_lines, sort_order=c.sort_order) for c in src.companions]
    dup.faqs = [Faq(question=f.question, answer=f.answer, category=f.category, is_active=f.is_active, sort_order=f.sort_order) for f in src.faqs]
    db.add(dup)
    await db.commit()
    dup = await get_or_404(db, Package, dup.id, PACKAGE_LOAD)
    return serialize_package(dup)


@router.post("/packages/bulk")
async def bulk_packages(payload: BulkActionIn, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Package).where(Package.id.in_(payload.ids)))).scalars().unique().all()
    for p in rows:
        if payload.action == "delete":
            await db.delete(p)
        elif payload.action in ("publish", "unpublish"):
            p.is_published = payload.action == "publish"
        elif payload.action in ("activate", "deactivate"):
            p.is_active = payload.action == "activate"
        elif payload.action in ("feature", "unfeature"):
            p.is_featured = payload.action == "feature"
    await db.commit()
    return {"ok": True, "affected": len(rows)}


@router.get("/package-status-options")
async def status_options():
    return {"statuses": ["AVAILABLE", "LIMITED_SEATS", "FULL", "CLOSED", "SOLD_OUT"]}
