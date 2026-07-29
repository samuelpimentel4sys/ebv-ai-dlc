from __future__ import annotations

import ssl
from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from prisma_pj.infrastructure.config import get_settings


def _ssl_connect_args() -> dict[str, object]:
    settings = get_settings()
    if not settings.database_ssl:
        return {}
    ctx = ssl.create_default_context()
    # lab Windows / proxy: espelha jdbc sslmode=require sem verify-full
    if settings.database_ssl_insecure:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    return {"ssl": ctx}


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_settings()
    return create_async_engine(
        settings.database_url,
        pool_pre_ping=True,
        connect_args=_ssl_connect_args(),
    )


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(get_engine(), expire_on_commit=False, class_=AsyncSession)


async def session_scope() -> AsyncIterator[AsyncSession]:
    factory = get_session_factory()
    async with factory() as session:
        await session.execute(text("SET search_path TO public, extensions"))
        yield session


def reset_db_caches() -> None:
    get_session_factory.cache_clear()
    get_engine.cache_clear()
