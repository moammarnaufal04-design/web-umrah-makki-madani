from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import current_admin
from database import get_db
from models import AdminUser, Media
from routers.common import get_or_404, paginate
from schemas import MediaUpdate
from storage import delete_paths, store_file
from utils import row_to_dict

router = APIRouter(prefix="/api/admin/media", tags=["admin-media"], dependencies=[Depends(current_admin)])

FOLDERS = ["general", "logo", "hero", "office", "jamaah", "makkah", "madinah", "hotel", "flyer", "wisata", "gallery", "video", "article", "testimonial", "category"]


@router.get("/folders")
async def folders():
    return FOLDERS


@router.get("")
async def list_media(folder: str | None = None, q: str | None = None, type: str | None = None, page: int = 1, limit: int = Query(40, le=200), db: AsyncSession = Depends(get_db)):
    stmt = select(Media)
    if folder:
        stmt = stmt.where(Media.folder == folder)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Media.original_name.ilike(like), Media.alt_text.ilike(like), Media.file_name.ilike(like)))
    if type == "image":
        stmt = stmt.where(Media.mime_type.like("image/%"))
    elif type == "pdf":
        stmt = stmt.where(Media.mime_type == "application/pdf")
    elif type == "video":
        stmt = stmt.where(Media.mime_type.like("video/%"))
    rows, total, meta = await paginate(db, stmt.order_by(Media.created_at.desc()), page, limit)
    return {"items": [row_to_dict(m) for m in rows], **meta}


@router.post("/upload", status_code=201)
async def upload(file: UploadFile = File(...), folder: str = Form("general"), alt_text: str = Form(""), admin: AdminUser = Depends(current_admin), db: AsyncSession = Depends(get_db)):
    data = await file.read()
    mime = (file.content_type or "").lower()
    try:
        info = await run_in_threadpool(store_file, data, mime, folder if folder in FOLDERS else "general", file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Upload ke storage gagal: {exc}")
    m = Media(**info, original_name=file.filename, folder=folder if folder in FOLDERS else "general", alt_text=alt_text or None, uploaded_by=admin.email)
    db.add(m)
    await db.commit()
    return row_to_dict(m)


@router.patch("/{media_id}")
async def update_media(media_id: str, payload: MediaUpdate, db: AsyncSession = Depends(get_db)):
    m = await get_or_404(db, Media, media_id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(m, k, v)
    await db.commit()
    return row_to_dict(m)


@router.post("/{media_id}/replace")
async def replace_media(media_id: str, file: UploadFile = File(...), admin: AdminUser = Depends(current_admin), db: AsyncSession = Depends(get_db)):
    m = await get_or_404(db, Media, media_id)
    data = await file.read()
    try:
        info = await run_in_threadpool(store_file, data, (file.content_type or "").lower(), m.folder, file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    old = [m.storage_path, m.thumb_path]
    for k, v in info.items():
        setattr(m, k, v)
    m.original_name = file.filename
    m.uploaded_by = admin.email
    await db.commit()
    await run_in_threadpool(delete_paths, old)
    return row_to_dict(m)


@router.delete("/{media_id}")
async def delete_media(media_id: str, db: AsyncSession = Depends(get_db)):
    m = await get_or_404(db, Media, media_id)
    paths = [m.storage_path, m.thumb_path]
    await db.delete(m)
    await db.commit()
    await run_in_threadpool(delete_paths, paths)
    return {"ok": True}
