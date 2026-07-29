from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.domain.port.outbound.group_graph import GroupGraphResult
from prisma_pj.infrastructure.persistence.model import (
    PjGroupEdgeRow,
    PjGroupSnapshotRow,
    PjOpinionRow,
    PjRelatedAlertRow,
)

_IN_FLIGHT_OPINION = frozenset(
    {
        "GENERATING",
        "DRAFT",
        "PARTIAL",
        "READY_FOR_REVIEW",
        "SUBMITTED",
        "IN_REVIEW",
        "PENDING_APPROVAL",
    }
)


class SqlAlchemyGroupRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save_snapshot(self, graph: GroupGraphResult) -> PjGroupSnapshotRow:
        snap_id = uuid.uuid4()
        refreshed = graph.fetched_at or datetime.now(UTC)
        row = PjGroupSnapshotRow(
            id=snap_id,
            root_cnpj=graph.root_cnpj,
            depth=graph.depth,
            node_count=graph.node_count,
            truncated=graph.truncated,
            total_exposure=graph.total_exposure,
            backend=graph.backend,
            payload_json={
                "nodes": [
                    {
                        "cnpj": n.cnpj,
                        "name": n.name,
                        "exposure": n.exposure,
                        "level": n.level,
                    }
                    for n in graph.nodes
                ],
                "warnings": list(graph.warnings),
            },
            refreshed_at=refreshed,
        )
        self._session.add(row)
        for edge in graph.edges:
            self._session.add(
                PjGroupEdgeRow(
                    id=uuid.uuid4(),
                    snapshot_id=snap_id,
                    from_cnpj=edge.from_cnpj,
                    to_cnpj=edge.to_cnpj,
                    relation=edge.relation,
                    share_pct=edge.share_pct,
                )
            )
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def latest_snapshot(self, root_cnpj: str) -> PjGroupSnapshotRow | None:
        stmt = (
            select(PjGroupSnapshotRow)
            .where(PjGroupSnapshotRow.root_cnpj == root_cnpj)
            .order_by(PjGroupSnapshotRow.refreshed_at.desc())
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list_edges(self, snapshot_id: uuid.UUID) -> list[PjGroupEdgeRow]:
        stmt = select(PjGroupEdgeRow).where(PjGroupEdgeRow.snapshot_id == snapshot_id)
        return list((await self._session.execute(stmt)).scalars().all())

    async def find_overlap_opinions(
        self, related_cnpjs: list[str], exclude_cnpj: str
    ) -> list[dict[str, Any]]:
        if not related_cnpjs:
            return []
        stmt = select(PjOpinionRow).where(
            PjOpinionRow.cnpj.in_(related_cnpjs),
            PjOpinionRow.cnpj != exclude_cnpj,
            PjOpinionRow.status.in_(_IN_FLIGHT_OPINION),
        )
        rows = list((await self._session.execute(stmt)).scalars().all())
        return [
            {
                "relatedCnpj": r.cnpj,
                "opinionId": str(r.id),
                "status": r.status,
            }
            for r in rows
        ]

    async def save_alerts(
        self, root_cnpj: str, overlaps: list[dict[str, Any]]
    ) -> list[PjRelatedAlertRow]:
        saved: list[PjRelatedAlertRow] = []
        for item in overlaps:
            opinion_raw = item.get("opinionId")
            row = PjRelatedAlertRow(
                id=uuid.uuid4(),
                cnpj=root_cnpj,
                related_cnpj=str(item["relatedCnpj"]),
                opinion_id=uuid.UUID(str(opinion_raw)) if opinion_raw else None,
            )
            self._session.add(row)
            saved.append(row)
        if saved:
            await self._session.commit()
        return saved
