import io
import logging
import os
import uuid

from PIL import Image, ImageOps
from supabase import create_client
from supabase.lib.client_options import SyncClientOptions

logger = logging.getLogger("storage")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "media")
APP_PREFIX = "makki-madani"

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOC_TYPES = {"application/pdf"}
ALLOWED_VIDEO_TYPES = {"video/mp4"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_DOC_BYTES = 20 * 1024 * 1024
MAX_VIDEO_BYTES = 50 * 1024 * 1024

_client = None


def client():
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY, options=SyncClientOptions(auto_refresh_token=False, persist_session=False))
    return _client


def ensure_bucket():
    try:
        client().storage.get_bucket(BUCKET)
    except Exception:
        client().storage.create_bucket(BUCKET, options={"public": True})
        logger.info("created storage bucket %s", BUCKET)


def validate_upload(mime: str, size: int):
    if mime in ALLOWED_IMAGE_TYPES:
        limit = MAX_IMAGE_BYTES
    elif mime in ALLOWED_DOC_TYPES:
        limit = MAX_DOC_BYTES
    elif mime in ALLOWED_VIDEO_TYPES:
        limit = MAX_VIDEO_BYTES
    else:
        raise ValueError("Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, GIF, PDF, atau MP4.")
    if size > limit:
        raise ValueError(f"Ukuran file melebihi batas {limit // (1024 * 1024)} MB.")


def optimize_image(data: bytes):
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)
    animated = getattr(img, "is_animated", False)
    if animated:
        return None
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.mode else "RGB")
    width, height = img.size
    main = img.copy()
    main.thumbnail((1920, 1920))
    thumb = img.copy()
    thumb.thumbnail((480, 480))
    out_main, out_thumb = io.BytesIO(), io.BytesIO()
    main.save(out_main, format="WEBP", quality=82, method=4)
    thumb.save(out_thumb, format="WEBP", quality=75, method=4)
    return out_main.getvalue(), out_thumb.getvalue(), width, height


def upload_bytes(path: str, data: bytes, content_type: str) -> str:
    bucket = client().storage.from_(BUCKET)
    bucket.upload(path, data, {"content-type": content_type, "upsert": "true", "cache-control": "31536000"})
    return bucket.get_public_url(path)


def delete_paths(paths: list[str]):
    paths = [p for p in paths if p]
    if paths:
        try:
            client().storage.from_(BUCKET).remove(paths)
        except Exception as exc:
            logger.warning("storage delete failed: %s", exc)


def store_file(data: bytes, mime: str, folder: str, original_name: str | None):
    validate_upload(mime, len(data))
    uid = uuid.uuid4().hex
    folder = folder or "general"
    if mime in ALLOWED_IMAGE_TYPES:
        optimized = optimize_image(data)
        if optimized:
            main_bytes, thumb_bytes, width, height = optimized
            path = f"{APP_PREFIX}/{folder}/{uid}.webp"
            thumb_path = f"{APP_PREFIX}/{folder}/thumbs/{uid}.webp"
            url = upload_bytes(path, main_bytes, "image/webp")
            thumb_url = upload_bytes(thumb_path, thumb_bytes, "image/webp")
            return dict(storage_path=path, thumb_path=thumb_path, url=url, thumb_url=thumb_url, mime_type="image/webp",
                        size_bytes=len(main_bytes), width=width, height=height, file_name=f"{uid}.webp")
        ext = (original_name or "file.gif").rsplit(".", 1)[-1].lower()
        path = f"{APP_PREFIX}/{folder}/{uid}.{ext}"
        url = upload_bytes(path, data, mime)
        return dict(storage_path=path, thumb_path=None, url=url, thumb_url=url, mime_type=mime, size_bytes=len(data), width=None, height=None, file_name=f"{uid}.{ext}")
    ext = "pdf" if mime == "application/pdf" else "mp4"
    path = f"{APP_PREFIX}/{folder}/{uid}.{ext}"
    url = upload_bytes(path, data, mime)
    return dict(storage_path=path, thumb_path=None, url=url, thumb_url=None, mime_type=mime, size_bytes=len(data), width=None, height=None, file_name=f"{uid}.{ext}")
