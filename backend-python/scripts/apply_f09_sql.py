"""Apply F09 DDL and stamp alembic_version."""

from __future__ import annotations

import asyncio
import ssl
from pathlib import Path

import asyncpg

from prisma_pj.infrastructure.config import get_settings


async def main() -> None:
    settings = get_settings()
    url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")
    ctx = ssl.create_default_context()
    if settings.database_ssl_insecure:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    conn = await asyncpg.connect(url, ssl=ctx)
    try:
        sql = Path("docs/sql/ep03_f09_routing.sql").read_text(encoding="utf-8")
        for part in sql.split(";"):
            lines = [
                line
                for line in part.splitlines()
                if line.strip() and not line.strip().startswith("--")
            ]
            if not lines:
                continue
            await conn.execute("\n".join(lines))
            print("OK", lines[0][:60])

        await conn.execute(
            "CREATE TABLE IF NOT EXISTS alembic_version "
            "(version_num VARCHAR(32) NOT NULL)"
        )
        current = await conn.fetchval("SELECT version_num FROM alembic_version LIMIT 1")
        if current is None:
            await conn.execute(
                "INSERT INTO alembic_version(version_num) VALUES ($1)", "004_ep03_f09"
            )
        else:
            await conn.execute(
                "UPDATE alembic_version SET version_num = $1", "004_ep03_f09"
            )
        print("stamped 004_ep03_f09")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
