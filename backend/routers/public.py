import os
from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from limiter import limiter
from models import (
    AdminUser, Article, ArticleCategory, ContactMessage, Customer, Faq, HomepageSection, NewsletterSubscriber,
    Package, ProductCategory, Registration, Tag, Testimonial,
)
from routers.common import get_settings_map, paginate
from schemas import ContactCreate, LoginIn, NewsletterCreate, RegistrationCreate
from serializers import PACKAGE_LOAD, serialize_article, serialize_package, serialize_package_summary
from utils import (
    format_date_id, format_rupiah, normalize_wa, now_utc, render_template, row_to_dict, short_code, wa_link,
)

router = APIRouter(prefix="/api/public", tags=["public"])
seo_router = APIRouter(prefix="/api/seo", tags=["seo"])
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]

DEFAULT_REGISTRATION_TEMPLATE = (
    "Assalamu'alaikum, saya ingin konsultasi {layanan}\n*Nama:* {nama}\n*WhatsApp:* {wa}\n*Paket:* {paket}\n"
    "*Rencana:* {rencana}\n*Catatan:* {catatan}\n*Form:* {form}\n*URL:* {url}\nMohon dibantu informasinya, terima kasih."
)

PUBLIC_PACKAGE_FILTER = and_(Package.is_published.is_(True), Package.is_active.is_(True))
ARTICLE_VISIBLE = and_(Article.status.in_(["PUBLISHED", "SCHEDULED"]), Article.published_at <= func.now())


@router.get("/site")
async def site(db: AsyncSession = Depends(get_db)):
    settings = await get_settings_map(db)
    sections = (await db.execute(select(HomepageSection).order_by(HomepageSection.sort_order))).scalars().all()
    cats = (await db.execute(select(ProductCategory).where(ProductCategory.is_active.is_(True)).order_by(ProductCategory.sort_order, ProductCategory.name))).scalars().all()
    return {"settings": settings, "sections": [row_to_dict(s) for s in sections], "categories": [row_to_dict(c) for c in cats]}


@router.get("/categories")
async def categories(group: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(ProductCategory).where(ProductCategory.is_active.is_(True))
    if group:
        stmt = stmt.where(ProductCategory.group_type == group.upper())
    rows = (await db.execute(stmt.order_by(ProductCategory.sort_order, ProductCategory.name))).scalars().all()
    counts = dict((await db.execute(
        select(Package.category_id, func.count(Package.id)).where(PUBLIC_PACKAGE_FILTER).group_by(Package.category_id)
    )).all())
    return [{**row_to_dict(c), "package_count": counts.get(c.id, 0)} for c in rows]


@router.get("/packages")
async def list_packages(
    group: str | None = None, category: str | None = None, q: str | None = None, featured: bool | None = None,
    month: str | None = None, sort: str = "departure_asc", page: int = 1, limit: int = Query(12, le=60),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Package).join(ProductCategory, Package.category_id == ProductCategory.id).where(PUBLIC_PACKAGE_FILTER)
    if group:
        stmt = stmt.where(ProductCategory.group_type == group.upper())
    if category:
        stmt = stmt.where(ProductCategory.slug == category)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Package.name.ilike(like), Package.short_description.ilike(like), ProductCategory.name.ilike(like), Package.airline.ilike(like)))
    if featured:
        stmt = stmt.where(Package.is_featured.is_(True))
    if month and len(month) == 7:
        y, m = month.split("-")
        stmt = stmt.where(func.extract("year", Package.departure_date) == int(y), func.extract("month", Package.departure_date) == int(m))
    orders = {
        "departure_asc": (Package.departure_date.asc().nulls_last(), Package.created_at.desc()),
        "price_asc": (Package.price.asc(),),
        "price_desc": (Package.price.desc(),),
        "newest": (Package.created_at.desc(),),
    }
    stmt = stmt.order_by(Package.is_featured.desc(), *orders.get(sort, orders["departure_asc"]))
    rows, total, meta = await paginate(db, stmt, page, limit)
    return {"items": [serialize_package_summary(p) for p in rows], **meta}


@router.get("/packages/months")
async def package_months(db: AsyncSession = Depends(get_db)):
    month_expr = func.to_char(Package.departure_date, "YYYY-MM").label("ym")
    rows = (await db.execute(
        select(month_expr).where(PUBLIC_PACKAGE_FILTER, Package.departure_date.is_not(None)).distinct().order_by(month_expr)
    )).scalars().all()
    return rows


@router.get("/packages/{slug}")
async def package_detail(slug: str, db: AsyncSession = Depends(get_db)):
    pkg = (await db.execute(select(Package).options(*PACKAGE_LOAD).where(Package.slug == slug, Package.is_published.is_(True)))).scalars().unique().one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paket tidak ditemukan")
    settings = await get_settings_map(db)
    wa = settings.get("whatsapp", {})
    number = wa.get("number") or settings.get("contact", {}).get("whatsapp") or ""
    tpl = pkg.whatsapp_message_template or wa.get("package_template") or "Assalamu'alaikum, saya ingin mendapatkan informasi paket {paket} untuk keberangkatan {tanggal}. Mohon informasi lengkapnya."
    message = render_template(tpl, {"paket": pkg.name, "tanggal": format_date_id(pkg.departure_date), "harga": format_rupiah(pkg.price)})
    related_stmt = (
        select(Package).where(PUBLIC_PACKAGE_FILTER, Package.id != pkg.id)
        .order_by((Package.category_id == pkg.category_id).desc(), Package.departure_date.asc().nulls_last()).limit(3)
    )
    related = (await db.execute(related_stmt)).scalars().unique().all()
    data = serialize_package(pkg)
    data["whatsapp_url"] = wa_link(number, message) if number else None
    data["related"] = [serialize_package_summary(p) for p in related]
    return data


@router.get("/articles")
async def list_articles(category: str | None = None, tag: str | None = None, q: str | None = None, page: int = 1, limit: int = Query(9, le=50), db: AsyncSession = Depends(get_db)):
    stmt = select(Article).where(ARTICLE_VISIBLE)
    if category:
        stmt = stmt.join(ArticleCategory, Article.category_id == ArticleCategory.id).where(ArticleCategory.slug == category)
    if tag:
        stmt = stmt.where(Article.tags.any(Tag.slug == tag))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Article.title.ilike(like), Article.excerpt.ilike(like)))
    stmt = stmt.order_by(Article.is_featured.desc(), Article.published_at.desc())
    rows, total, meta = await paginate(db, stmt, page, limit)
    return {"items": [serialize_article(a) for a in rows], **meta}


@router.get("/articles/{slug}")
async def article_detail(slug: str, db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(Article).where(Article.slug == slug, ARTICLE_VISIBLE))).scalars().unique().one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")
    a.view_count = (a.view_count or 0) + 1
    await db.commit()
    related = []
    if a.related_article_ids:
        related = (await db.execute(select(Article).where(Article.id.in_(a.related_article_ids), ARTICLE_VISIBLE))).scalars().unique().all()
    if len(related) < 3:
        extra = (await db.execute(
            select(Article).where(ARTICLE_VISIBLE, Article.id != a.id, Article.id.not_in([r.id for r in related] or ["-"]))
            .order_by((Article.category_id == a.category_id).desc(), Article.published_at.desc()).limit(3 - len(related))
        )).scalars().unique().all()
        related = list(related) + list(extra)
    data = serialize_article(a, full=True)
    data["related"] = [serialize_article(r) for r in related]
    return data


@router.get("/article-categories")
async def article_categories(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ArticleCategory).where(ArticleCategory.is_active.is_(True)).order_by(ArticleCategory.sort_order))).scalars().all()
    counts = dict((await db.execute(select(Article.category_id, func.count(Article.id)).where(ARTICLE_VISIBLE).group_by(Article.category_id))).all())
    return [{**row_to_dict(c), "article_count": counts.get(c.id, 0)} for c in rows]


@router.get("/tags")
async def tags(db: AsyncSession = Depends(get_db)):
    return [row_to_dict(t) for t in (await db.execute(select(Tag).order_by(Tag.name))).scalars().all()]


@router.get("/faqs")
async def faqs(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Faq).where(Faq.package_id.is_(None), Faq.is_active.is_(True)).order_by(Faq.sort_order))).scalars().all()
    return [row_to_dict(f) for f in rows]


@router.get("/testimonials")
async def testimonials(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Testimonial).where(Testimonial.is_active.is_(True)).order_by(Testimonial.sort_order))).scalars().all()
    return [row_to_dict(t) for t in rows]


@router.post("/registrations", status_code=201)
@limiter.limit("10/minute")
async def create_registration(request: Request, payload: RegistrationCreate, db: AsyncSession = Depends(get_db)):
    if payload.website:
        return {"ok": True}
    pkg = (await db.execute(select(Package).where(Package.id == payload.package_id, Package.is_published.is_(True)))).scalars().unique().one_or_none()
    if not pkg:
        raise HTTPException(status_code=404, detail="Paket tidak ditemukan")
    wa_norm = normalize_wa(payload.whatsapp)
    customer = await db.scalar(select(Customer).where(Customer.whatsapp == wa_norm))
    if not customer:
        customer = Customer(full_name=payload.full_name.strip(), gender=payload.gender, address=payload.address, whatsapp=wa_norm, email=payload.email)
        db.add(customer)
        await db.flush()
    else:
        customer.full_name = payload.full_name.strip()
        customer.gender = payload.gender
        customer.address = payload.address
        if payload.email:
            customer.email = payload.email
    reg = Registration(
        code=short_code("MM"), customer_id=customer.id, package_id=pkg.id, package_name=pkg.name, package_price=pkg.price,
        dp_amount=pkg.dp_amount, full_name=payload.full_name.strip(), gender=payload.gender, address=payload.address,
        whatsapp=wa_norm, email=payload.email, plan_month=payload.plan_month, notes=payload.notes,
        source_page=payload.source_page, registered_at=now_utc(),
    )
    db.add(reg)
    await db.commit()
    settings = await get_settings_map(db)
    wa = settings.get("whatsapp", {})
    number = wa.get("number") or settings.get("contact", {}).get("whatsapp") or ""
    group = pkg.category.group_type.lower() if pkg.category else "umrah"
    layanan = {"haji": "haji", "wisata": "wisata halal"}.get(group, "umroh")
    msg = render_template(wa.get("registration_template") or DEFAULT_REGISTRATION_TEMPLATE, {
        "layanan": layanan, "nama": reg.full_name, "wa": payload.whatsapp, "paket": pkg.name,
        "rencana": payload.plan_month or format_date_id(pkg.departure_date), "catatan": payload.notes or "-",
        "form": wa.get("registration_form_name") or "Form Pendaftaran Paket", "url": payload.source_page or "", "kode": reg.code,
    })
    return {
        "registration": {"id": reg.id, "code": reg.code, "full_name": reg.full_name, "package_name": reg.package_name, "status": reg.status, "registered_at": reg.registered_at.isoformat()},
        "whatsapp_url": wa_link(number, msg) if number else None,
        "whatsapp_group_url": wa.get("group_url") or None,
        "message": msg,
    }


@router.post("/contact", status_code=201)
@limiter.limit("10/minute")
async def create_contact(request: Request, payload: ContactCreate, db: AsyncSession = Depends(get_db)):
    if payload.website:
        return {"ok": True}
    msg = ContactMessage(name=payload.name.strip(), whatsapp=normalize_wa(payload.whatsapp), email=payload.email, subject=payload.subject, message=payload.message, package_interest=payload.package_interest)
    db.add(msg)
    await db.commit()
    settings = await get_settings_map(db)
    wa = settings.get("whatsapp", {})
    number = wa.get("number") or settings.get("contact", {}).get("whatsapp") or ""
    text = f"Assalamu'alaikum, saya {payload.name}. {payload.message}"
    return {"id": msg.id, "whatsapp_url": wa_link(number, text) if number else None}


@router.post("/newsletter", status_code=201)
@limiter.limit("10/minute")
async def subscribe(request: Request, payload: NewsletterCreate, db: AsyncSession = Depends(get_db)):
    if payload.website:
        return {"ok": True}
    email = payload.email.lower()
    existing = await db.scalar(select(NewsletterSubscriber).where(NewsletterSubscriber.email == email))
    if existing:
        existing.is_active = True
    else:
        db.add(NewsletterSubscriber(email=email))
    await db.commit()
    return {"ok": True, "message": "Terima kasih, Anda telah berlangganan."}


@seo_router.get("/sitemap.xml")
async def sitemap(db: AsyncSession = Depends(get_db)):
    settings = await get_settings_map(db)
    base = (settings.get("seo", {}).get("site_url") or os.environ.get("PUBLIC_SITE_URL", "")).rstrip("/")
    today = date.today().isoformat()
    entries = [(f"{base}{p}", today, pr) for p, pr in [("/", "1.0"), ("/packages", "0.9"), ("/packages/umrah", "0.9"), ("/packages/haji", "0.9"), ("/packages/wisata", "0.8"), ("/about", "0.7"), ("/articles", "0.7"), ("/contact", "0.6"), ("/faq", "0.5"), ("/legal", "0.3"), ("/privacy", "0.3"), ("/terms", "0.3")]]
    pkgs = (await db.execute(select(Package.slug, Package.updated_at).where(PUBLIC_PACKAGE_FILTER))).all()
    entries += [(f"{base}/packages/{s}", u.date().isoformat(), "0.8") for s, u in pkgs]
    arts = (await db.execute(select(Article.slug, Article.updated_at).where(ARTICLE_VISIBLE))).all()
    entries += [(f"{base}/articles/{s}", u.date().isoformat(), "0.6") for s, u in arts]
    body = "".join(f"<url><loc>{loc}</loc><lastmod>{lm}</lastmod><priority>{pr}</priority></url>" for loc, lm, pr in entries)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'
    return Response(content=xml, media_type="application/xml")


@seo_router.get("/robots.txt")
async def robots(db: AsyncSession = Depends(get_db)):
    settings = await get_settings_map(db)
    base = (settings.get("seo", {}).get("site_url") or os.environ.get("PUBLIC_SITE_URL", "")).rstrip("/")
    return PlainTextResponse(f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\n\nSitemap: {base}/api/seo/sitemap.xml\n")


@auth_router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginIn, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json"},
            json={"email": payload.email, "password": payload.password},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Email atau password salah")
    data = r.json()
    email = (data.get("user") or {}).get("email", "").casefold()
    admin = await db.scalar(select(AdminUser).where(AdminUser.email == email, AdminUser.is_active.is_(True)))
    if not admin and email not in {x.strip().casefold() for x in os.environ.get("ADMIN_EMAILS", "").split(",") if x.strip()}:
        raise HTTPException(status_code=403, detail="Akun ini tidak memiliki akses Super Admin")
    return {"access_token": data["access_token"], "refresh_token": data.get("refresh_token"), "expires_in": data.get("expires_in"), "user": {"id": data["user"]["id"], "email": email}}
