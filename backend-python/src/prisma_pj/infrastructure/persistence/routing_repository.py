from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.domain.service.routing import RouteDecision
from prisma_pj.infrastructure.persistence.model import (
    PjInferenceCostRow,
    PjRoutingDecisionRow,
    PjRoutingPolicyRow,
)


class SqlAlchemyRoutingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_active_policy(self) -> PjRoutingPolicyRow | None:
        stmt = (
            select(PjRoutingPolicyRow)
            .where(PjRoutingPolicyRow.active.is_(True))
            .order_by(PjRoutingPolicyRow.version.desc())
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def find_by_name(self, name: str) -> PjRoutingPolicyRow | None:
        stmt = (
            select(PjRoutingPolicyRow)
            .where(PjRoutingPolicyRow.name == name)
            .order_by(PjRoutingPolicyRow.version.desc())
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def save_policy(
        self,
        *,
        name: str,
        rules_json: dict[str, Any],
        active: bool,
        version: int,
        policy_id: uuid.UUID | None = None,
    ) -> PjRoutingPolicyRow:
        row = PjRoutingPolicyRow(
            id=policy_id or uuid.uuid4(),
            name=name,
            rules_json=rules_json,
            active=active,
            version=version,
        )
        self._session.add(row)
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def deactivate_all_except(self, keep_id: uuid.UUID) -> None:
        from sqlalchemy import update

        await self._session.execute(
            update(PjRoutingPolicyRow)
            .where(
                PjRoutingPolicyRow.id != keep_id,
                PjRoutingPolicyRow.active.is_(True),
            )
            .values(active=False)
        )
        await self._session.commit()

    async def save_decision(
        self,
        decision: RouteDecision,
        *,
        opinion_id: uuid.UUID | None = None,
    ) -> PjRoutingDecisionRow:
        row = PjRoutingDecisionRow(
            id=uuid.uuid4(),
            task_type=decision.task_type,
            model_chosen=decision.model_chosen,
            reason=decision.reason[:200],
            opinion_id=opinion_id,
            promoted=decision.promoted,
            model_class=decision.model_class,
        )
        self._session.add(row)
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def list_decisions(
        self, *, limit: int = 50, offset: int = 0
    ) -> list[PjRoutingDecisionRow]:
        stmt = (
            select(PjRoutingDecisionRow)
            .order_by(PjRoutingDecisionRow.at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list((await self._session.execute(stmt)).scalars().all())

    async def save_cost(
        self,
        *,
        model: str,
        input_tokens: int,
        output_tokens: int,
        usd: float,
        task_type: str | None,
        provider: str | None,
    ) -> PjInferenceCostRow:
        row = PjInferenceCostRow(
            id=uuid.uuid4(),
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            usd=usd,
            task_type=task_type,
            provider=provider,
        )
        self._session.add(row)
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def sum_cost_usd(
        self,
        *,
        since: datetime,
        until: datetime | None = None,
    ) -> float:
        until = until or datetime.now(UTC)
        stmt = select(func.coalesce(func.sum(PjInferenceCostRow.usd), 0)).where(
            PjInferenceCostRow.at >= since,
            PjInferenceCostRow.at <= until,
        )
        value = (await self._session.execute(stmt)).scalar_one()
        return float(value or 0)

    async def cost_breakdown(
        self,
        *,
        since: datetime,
        until: datetime | None = None,
    ) -> list[dict[str, Any]]:
        until = until or datetime.now(UTC)
        stmt = (
            select(
                PjInferenceCostRow.model,
                func.sum(PjInferenceCostRow.input_tokens),
                func.sum(PjInferenceCostRow.output_tokens),
                func.sum(PjInferenceCostRow.usd),
                func.count(),
            )
            .where(
                PjInferenceCostRow.at >= since,
                PjInferenceCostRow.at <= until,
            )
            .group_by(PjInferenceCostRow.model)
            .order_by(func.sum(PjInferenceCostRow.usd).desc())
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            {
                "model": r[0],
                "inputTokens": int(r[1] or 0),
                "outputTokens": int(r[2] or 0),
                "usd": float(r[3] or 0),
                "calls": int(r[4] or 0),
            }
            for r in rows
        ]
