import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.concurrency import run_in_threadpool  # noqa: E402
from fastapi.exceptions import RequestValidationError  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from slowapi.errors import RateLimitExceeded  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

from limiter import limiter  # noqa: E402
from routers import admin_catalog, admin_cms, admin_content, admin_customers, admin_dashboard, admin_media, public  # noqa: E402
from storage import ensure_bucket  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("server")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await run_in_threadpool(ensure_bucket)
    except Exception as exc:
        logger.error("storage bucket init failed: %s", exc)
    yield


app = FastAPI(title="Makki Madani Tour & Travel API", version="1.0.0", lifespan=lifespan, docs_url="/api/docs", openapi_url="/api/openapi.json")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Terlalu banyak permintaan. Silakan coba lagi beberapa saat."})


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = [{"field": ".".join(str(x) for x in e.get("loc", [])[1:]), "message": e.get("msg", "")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": "Data yang dikirim tidak valid", "errors": errors})


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "makki-madani-api"}


for r in (public.router, public.seo_router, public.auth_router, admin_dashboard.router, admin_catalog.router, admin_customers.router, admin_cms.router, admin_content.router, admin_media.router):
    app.include_router(r)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)
