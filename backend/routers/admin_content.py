from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import current_admin
from database import get_db
from models import Article, ArticleCategory, Tag
from routers.common import get_or_404, paginate, unique_slug
from schemas import ArticleCategoryIn, ArticleIn, TagIn
from serializers import serialize_article
from utils import now_utc, row_to_dict

router = APIRouter(prefix="/api/admin", tags=["admin-content"], dependencies=[Depends(current_admin)])

ARTICLE_SCALARS = set(ArticleIn.model_fields) - {"slug", "tag_ids"}


@router.get("/articles")
async def list_articles(q: str | None = None, status: str | None = None, category_id: str | None = None, page: int = 1, limit: int = Query(20, le=200), db: AsyncSession = Depends(get_db)):
    stmt = select(Article)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Article.title.ilike(like), Article.excerpt.ilike(like)))
    if status:
        stmt = stmt.where(Article.status == status)
    if category_id:
        stmt = stmt.where(Article.category_id == category_id)
    rows, total, meta = await paginate(db, stmt.order_by(Article.updated_at.desc()), page, limit)
    return {"items": [serialize_article(a) for a in rows], **meta}


async def apply_article(db, a: Article, payload: ArticleIn):
    for k, v in payload.model_dump(include=ARTICLE_SCALARS).items():
        setattr(a, k, v)
    if payload.status == "PUBLISHED" and not a.published_at:
        a.published_at = now_utc()
    if payload.status == "SCHEDULED" and not a.published_at:
        raise HTTPException(status_code=422, detail="Tanggal publikasi wajib diisi untuk artikel terjadwal")
    if payload.tag_ids:
        a.tags = list((await db.execute(select(Tag).where(Tag.id.in_(payload.tag_ids)))).scalars().all())
    else:
        a.tags = []


@router.post("/articles", status_code=201)
async def create_article(payload: ArticleIn, db: AsyncSession = Depends(get_db)):
    a = Article(slug=await unique_slug(db, Article, payload.slug or payload.title))
    await apply_article(db, a, payload)
    db.add(a)
    await db.commit()
    a = await get_or_404(db, Article, a.id)
    return serialize_article(a, full=True)


@router.get("/articles/{a_id}")
async def get_article(a_id: str, db: AsyncSession = Depends(get_db)):
    a = await get_or_404(db, Article, a_id, detail="Artikel tidak ditemukan")
    return serialize_article(a, full=True)


@router.put("/articles/{a_id}")
async def update_article(a_id: str, payload: ArticleIn, db: AsyncSession = Depends(get_db)):
    a = await get_or_404(db, Article, a_id, detail="Artikel tidak ditemukan")
    if payload.slug and payload.slug != a.slug:
        a.slug = await unique_slug(db, Article, payload.slug, a.id)
    await apply_article(db, a, payload)
    await db.commit()
    db.expunge_all()
    a = await get_or_404(db, Article, a_id)
    return serialize_article(a, full=True)


@router.delete("/articles/{a_id}")
async def delete_article(a_id: str, db: AsyncSession = Depends(get_db)):
    a = await get_or_404(db, Article, a_id, detail="Artikel tidak ditemukan")
    await db.delete(a)
    await db.commit()
    return {"ok": True}


# ---------- Article categories ----------
@router.get("/article-categories")
async def list_article_categories(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ArticleCategory).order_by(ArticleCategory.sort_order, ArticleCategory.name))).scalars().all()
    counts = dict((await db.execute(select(Article.category_id, func.count(Article.id)).group_by(Article.category_id))).all())
    return [{**row_to_dict(c), "article_count": counts.get(c.id, 0)} for c in rows]


@router.post("/article-categories", status_code=201)
async def create_article_category(payload: ArticleCategoryIn, db: AsyncSession = Depends(get_db)):
    c = ArticleCategory(**payload.model_dump(exclude={"slug"}), slug=await unique_slug(db, ArticleCategory, payload.slug or payload.name))
    db.add(c)
    await db.commit()
    return row_to_dict(c)


@router.put("/article-categories/{c_id}")
async def update_article_category(c_id: str, payload: ArticleCategoryIn, db: AsyncSession = Depends(get_db)):
    c = await get_or_404(db, ArticleCategory, c_id)
    for k, v in payload.model_dump(exclude={"slug"}).items():
        setattr(c, k, v)
    if payload.slug and payload.slug != c.slug:
        c.slug = await unique_slug(db, ArticleCategory, payload.slug, c.id)
    await db.commit()
    return row_to_dict(c)


@router.delete("/article-categories/{c_id}")
async def delete_article_category(c_id: str, db: AsyncSession = Depends(get_db)):
    c = await get_or_404(db, ArticleCategory, c_id)
    await db.delete(c)
    await db.commit()
    return {"ok": True}


# ---------- Tags ----------
@router.get("/tags")
async def list_tags(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Tag).order_by(Tag.name))).scalars().all()
    return [row_to_dict(t) for t in rows]


@router.post("/tags", status_code=201)
async def create_tag(payload: TagIn, db: AsyncSession = Depends(get_db)):
    t = Tag(name=payload.name, slug=await unique_slug(db, Tag, payload.slug or payload.name))
    db.add(t)
    await db.commit()
    return row_to_dict(t)


@router.put("/tags/{t_id}")
async def update_tag(t_id: str, payload: TagIn, db: AsyncSession = Depends(get_db)):
    t = await get_or_404(db, Tag, t_id)
    t.name = payload.name
    if payload.slug and payload.slug != t.slug:
        t.slug = await unique_slug(db, Tag, payload.slug, t.id)
    await db.commit()
    return row_to_dict(t)


@router.delete("/tags/{t_id}")
async def delete_tag(t_id: str, db: AsyncSession = Depends(get_db)):
    t = await get_or_404(db, Tag, t_id)
    await db.delete(t)
    await db.commit()
    return {"ok": True}
