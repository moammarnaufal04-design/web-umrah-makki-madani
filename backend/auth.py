import logging
import os
import time
from typing import Annotated

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import AdminUser
from utils import now_utc

logger = logging.getLogger("auth")

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.environ["SUPABASE_PUBLISHABLE_KEY"]
ISSUER = f"{SUPABASE_URL}/auth/v1"
JWKS_URL = f"{ISSUER}/.well-known/jwks.json"
JWT_SECRET = (os.environ.get("SUPABASE_JWT_SECRET") or "").strip() or None
ADMIN_EMAILS = {x.strip().casefold() for x in os.environ.get("ADMIN_EMAILS", "").split(",") if x.strip()}

jwks_client = PyJWKClient(JWKS_URL, cache_jwk_set=True, lifespan=600)
bearer = HTTPBearer(auto_error=False)
_remote_cache: dict[str, tuple[float, dict]] = {}


def unauthorized(detail="Token tidak valid atau sudah kedaluwarsa"):
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, headers={"WWW-Authenticate": "Bearer"})


def _verify_remote(token: str) -> dict:
    cached = _remote_cache.get(token)
    if cached and cached[0] > time.time():
        return cached[1]
    r = httpx.get(f"{ISSUER}/user", headers={"apikey": SUPABASE_PUBLISHABLE_KEY, "Authorization": f"Bearer {token}"}, timeout=10)
    if r.status_code != 200:
        raise ValueError("remote verification failed")
    u = r.json()
    claims = {"sub": u.get("id"), "email": u.get("email")}
    _remote_cache[token] = (time.time() + 60, claims)
    return claims


def verify_access_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        if alg == "HS256":
            if not JWT_SECRET:
                return _verify_remote(token)
            key, algorithms = JWT_SECRET, ["HS256"]
        elif alg in {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512"}:
            key, algorithms = jwks_client.get_signing_key_from_jwt(token).key, [alg]
        else:
            raise ValueError("unsupported alg")
        claims = jwt.decode(
            token, key, algorithms=algorithms, audience="authenticated", issuer=ISSUER,
            options={"require": ["exp", "iat", "sub", "iss", "aud"]},
        )
        if not claims.get("sub") or not claims.get("email"):
            raise ValueError("missing claims")
        return claims
    except Exception as exc:
        logger.warning("token verification failed: %s", type(exc).__name__)
        raise unauthorized() from exc


async def current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise unauthorized("Silakan login terlebih dahulu")
    claims = verify_access_token(credentials.credentials)
    email = claims["email"].casefold()
    admin = await db.scalar(select(AdminUser).where(AdminUser.email == email))
    if not admin and email in ADMIN_EMAILS:
        admin = AdminUser(email=email, auth_user_id=claims["sub"], full_name=email.split("@")[0], role="SUPER_ADMIN", is_active=True)
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
    if not admin or not admin.is_active:
        raise HTTPException(status_code=403, detail="Akun ini tidak memiliki akses Super Admin")
    if admin.auth_user_id != claims["sub"]:
        admin.auth_user_id = claims["sub"]
        await db.commit()
    return admin


async def touch_login(admin: AdminUser, db: AsyncSession):
    admin.last_login_at = now_utc()
    await db.commit()
