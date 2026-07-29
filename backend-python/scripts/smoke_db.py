import asyncio

from sqlalchemy import text

from prisma_pj.infrastructure.config import get_settings
from prisma_pj.infrastructure.persistence.db import reset_db_caches, session_scope
from prisma_pj.infrastructure.persistence.rag_repository import ping_database


async def main() -> None:
    get_settings.cache_clear()
    reset_db_caches()
    settings = get_settings()
    print("ssl", settings.database_ssl)
    print("dbhost", settings.database_url.split("@")[-1][:80])
    async for session in session_scope():
        ok = await ping_database(session)
        print("db_ping", ok)
        count = await session.execute(text("SELECT count(*) FROM tb_pj_rag_chunk"))
        print("rag_chunks", count.scalar())
        tables = await session.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name LIKE 'tb_pj%' ORDER BY 1"
            )
        )
        print("tables", [r[0] for r in tables.fetchall()])
        break


if __name__ == "__main__":
    asyncio.run(main())
