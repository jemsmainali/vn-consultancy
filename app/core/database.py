from uuid import uuid4

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    # Neon suspends idle computes, which drops pooled connections; check before reuse.
    pool_pre_ping=True,
    # Unique statement names so asyncpg is safe behind Neon's PgBouncer (-pooler) endpoint.
    connect_args={"prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__"},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency: yields a DB session and always closes it, even on error."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
