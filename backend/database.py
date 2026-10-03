import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.environ["DATABASE_URL"]
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Supabase pooler is in transaction mode (port 6543) which does not persist
# prepared statements across transactions. NullPool ensures each request uses
# a fresh asyncpg connection, and statement_cache_size=0 + unique prepared
# statement names avoid "prepared statement does not exist" errors.
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    poolclass=NullPool,
    echo=False,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4()}__",
        "command_timeout": 30,
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False, autocommit=False, autoflush=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
