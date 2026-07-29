"""Smoke cruzado Emilly↔Noah F04.

1) Python: cria opinion READY_FOR_REVIEW + guardrail PASSED (mesmo Supabase)
2) Java :8080: submit → approve → trail
3) Python: relê status APPROVED

Uso:
  uv run python scripts/smoke_f04_cross.py
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from datetime import UTC, datetime

import httpx
from sqlalchemy import select

from prisma_pj.infrastructure.config import get_settings
from prisma_pj.infrastructure.persistence.db import reset_db_caches, session_scope
from prisma_pj.infrastructure.persistence.model import (
    PjGuardrailReportRow,
    PjOpinionRow,
    PjOpinionSectionRow,
)

JAVA = "http://127.0.0.1:8080"
CNPJ = "12345678000199"
CREATOR = uuid.UUID("00000000-0000-4000-8000-000000000001")
APPROVER = uuid.UUID("00000000-0000-4000-8000-0000000000bb")
AMOUNT = 2_500_000.0  # faixa L2 tipica


async def seed_ready_opinion() -> uuid.UUID:
    opinion_id = uuid.uuid4()
    async for session in session_scope():
        session.add(
            PjOpinionRow(
                id=opinion_id,
                cnpj=CNPJ,
                status="READY_FOR_REVIEW",
                model_route="smoke-f04",
                created_by=CREATOR,
                operation_amount=AMOUNT,
                currency="BRL",
                completed_at=datetime.now(UTC),
                elapsed_ms=1,
            )
        )
        await session.flush()
        session.add(
            PjOpinionSectionRow(
                id=uuid.uuid4(),
                opinion_id=opinion_id,
                code="RESUMO",
                content_md="Parecer smoke F04 — sem numeros inventados.",
                status="READY",
                citation_ids=[],
            )
        )
        session.add(
            PjGuardrailReportRow(
                id=uuid.uuid4(),
                opinion_id=opinion_id,
                status="PASSED",
                model="smoke-f04",
            )
        )
        await session.commit()
        print("seed_opinion", opinion_id, "READY_FOR_REVIEW + guardrail PASSED")
        break
    return opinion_id


async def read_status(opinion_id: uuid.UUID) -> str:
    async for session in session_scope():
        row = (
            await session.execute(select(PjOpinionRow).where(PjOpinionRow.id == opinion_id))
        ).scalar_one()
        return row.status
    raise RuntimeError("no session")


def java_hitl(opinion_id: uuid.UUID) -> None:
    oid = str(opinion_id)
    with httpx.Client(base_url=JAVA, timeout=30.0) as client:
        health = client.get("/actuator/health")
        print("java_health", health.status_code, health.text[:80])
        if health.status_code >= 400:
            raise SystemExit("JAVA_DOWN")

        submit = client.post(
            f"/api/v1/pj/opinions/{oid}/submit",
            json={"actorId": str(CREATOR), "comment": "smoke Emilly→Noah submit"},
        )
        print("submit", submit.status_code, submit.text)
        if submit.status_code >= 400:
            raise SystemExit(f"SUBMIT_FAIL {submit.status_code}")
        body = submit.json()
        assert body.get("status") == "SUBMITTED", body

        approve = client.post(
            f"/api/v1/pj/opinions/{oid}/approve",
            json={
                "decision": "APPROVE",
                "comment": "smoke approve L3",
                "actorId": str(APPROVER),
                "actorMaxLevel": "L3",
            },
        )
        print("approve", approve.status_code, approve.text)
        if approve.status_code >= 400:
            raise SystemExit(f"APPROVE_FAIL {approve.status_code}")
        abody = approve.json()
        assert abody.get("status") == "APPROVED", abody

        trail = client.get(f"/api/v1/pj/opinions/{oid}/trail")
        print("trail", trail.status_code, trail.text[:500].encode("ascii", "replace").decode())
        if trail.status_code >= 400:
            raise SystemExit(f"TRAIL_FAIL {trail.status_code}")
        tbody = trail.json()
        actions = [t.get("action") for t in tbody.get("trail", [])]
        print("trail_actions", actions)
        if len(actions) < 2:
            raise SystemExit(f"TRAIL_TOO_SHORT {actions}")


async def main() -> None:
    get_settings.cache_clear()
    reset_db_caches()
    print("db", get_settings().database_url.split("@")[-1])

    opinion_id = await seed_ready_opinion()
    java_hitl(opinion_id)

    status = await read_status(opinion_id)
    print("final_status_db", status)
    if status != "APPROVED":
        print("SMOKE_F04_FAIL status=", status, file=sys.stderr)
        raise SystemExit(1)
    print("SMOKE_F04_CROSS_OK")


if __name__ == "__main__":
    asyncio.run(main())
