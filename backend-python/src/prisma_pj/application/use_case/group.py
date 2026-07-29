from __future__ import annotations

import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from prisma_pj.domain.exception import DomainError
from prisma_pj.domain.port.outbound.group_graph import GroupGraphGateway
from prisma_pj.infrastructure.persistence.group_repository import SqlAlchemyGroupRepository

_CNPJ_RE = re.compile(r"^\d{14}$")
_MAX_DEPTH = 3
_STALE_DAYS = 7


def _cnpj(value: str) -> str:
    normalized = value.strip()
    if not _CNPJ_RE.match(normalized):
        raise DomainError("CNPJ deve ter 14 digitos")
    return normalized


class GetGroupExposure:
    def __init__(
        self,
        repo: SqlAlchemyGroupRepository,
        graph: GroupGraphGateway,
        *,
        max_nodes: int = 50,
        stale_days: int = _STALE_DAYS,
        auto_refresh_if_missing: bool = True,
    ) -> None:
        self._repo = repo
        self._graph = graph
        self._max_nodes = max_nodes
        self._stale_days = stale_days
        self._auto_refresh = auto_refresh_if_missing

    async def execute(self, cnpj: str, depth: int = 3) -> dict[str, Any]:
        root = _cnpj(cnpj)
        depth = max(1, min(int(depth), _MAX_DEPTH))
        snap = await self._repo.latest_snapshot(root)
        warnings: list[str] = []

        if snap is None:
            if not self._auto_refresh:
                raise DomainError(
                    "Snapshot de grupo inexistente — chame POST /group/refresh"
                )
            graph = await self._graph.fetch_group(
                root, depth=depth, max_nodes=self._max_nodes
            )
            snap = await self._repo.save_snapshot(graph)
            nodes = [
                {
                    "cnpj": n.cnpj,
                    "name": n.name,
                    "exposure": n.exposure,
                    "level": n.level,
                }
                for n in graph.nodes
            ]
            warnings.extend(graph.warnings)
            truncated = graph.truncated
            total = graph.total_exposure
            node_count = graph.node_count
            backend = graph.backend
            effective_depth = graph.depth
        else:
            nodes = list((snap.payload_json or {}).get("nodes") or [])
            warnings.extend(list((snap.payload_json or {}).get("warnings") or []))
            truncated = snap.truncated
            total = float(snap.total_exposure or 0)
            node_count = snap.node_count
            backend = snap.backend
            effective_depth = snap.depth

        refreshed_at = snap.refreshed_at
        if refreshed_at.tzinfo is None:
            refreshed_at = refreshed_at.replace(tzinfo=UTC)
        stale = datetime.now(UTC) - refreshed_at > timedelta(days=self._stale_days)
        if stale:
            warnings.append(
                f"Snapshot stale (> {self._stale_days}d) — sugerido POST /group/refresh"
            )

        related = [str(n["cnpj"]) for n in nodes if str(n.get("cnpj")) != root]
        overlaps = await self._repo.find_overlap_opinions(related, root)
        if overlaps:
            await self._repo.save_alerts(root, overlaps)
            warnings.append("Parte relacionada com operacao em analise")

        return {
            "rootCnpj": root,
            "depth": effective_depth,
            "nodeCount": node_count,
            "truncated": truncated,
            "totalExposure": total,
            "refreshedAt": refreshed_at.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "stale": stale,
            "backend": backend,
            "nodes": [
                {
                    "cnpj": str(n["cnpj"]),
                    "name": str(n.get("name", "")),
                    "exposure": float(cast(Any, n.get("exposure") or 0)),
                }
                for n in nodes
            ],
            "overlapAlerts": overlaps,
            "warnings": warnings,
            "snapshotId": str(snap.id),
        }


class GetRelatedParties:
    def __init__(self, repo: SqlAlchemyGroupRepository) -> None:
        self._repo = repo

    async def execute(self, cnpj: str) -> dict[str, Any]:
        root = _cnpj(cnpj)
        snap = await self._repo.latest_snapshot(root)
        if snap is None:
            raise DomainError("Snapshot de grupo inexistente — chame POST /group/refresh")

        edges = await self._repo.list_edges(snap.id)
        parties = [
            {
                "fromCnpj": e.from_cnpj,
                "toCnpj": e.to_cnpj,
                "relation": e.relation,
                "sharePct": float(e.share_pct) if e.share_pct is not None else None,
            }
            for e in edges
        ]
        related_cnpjs = sorted(
            ({e.to_cnpj for e in edges} | {e.from_cnpj for e in edges}) - {root}
        )
        overlaps = await self._repo.find_overlap_opinions(list(related_cnpjs), root)
        return {
            "rootCnpj": root,
            "snapshotId": str(snap.id),
            "relatedParties": parties,
            "overlapAlerts": overlaps,
        }


class RefreshGroup:
    def __init__(
        self,
        repo: SqlAlchemyGroupRepository,
        graph: GroupGraphGateway,
        *,
        max_nodes: int = 50,
    ) -> None:
        self._repo = repo
        self._graph = graph
        self._max_nodes = max_nodes

    async def execute(self, cnpj: str, depth: int = 3) -> dict[str, Any]:
        root = _cnpj(cnpj)
        depth = max(1, min(int(depth), _MAX_DEPTH))
        try:
            graph = await self._graph.fetch_group(
                root, depth=depth, max_nodes=self._max_nodes
            )
        except DomainError as exc:
            if "timeout" in str(exc).lower():
                raise DomainError("Neptune timeout") from exc
            raise
        snap = await self._repo.save_snapshot(graph)
        return {
            "status": "ACCEPTED",
            "jobId": str(uuid.uuid4()),
            "snapshotId": str(snap.id),
            "rootCnpj": root,
            "depth": depth,
            "nodeCount": graph.node_count,
            "truncated": graph.truncated,
            "backend": graph.backend,
            "warnings": list(graph.warnings),
        }
