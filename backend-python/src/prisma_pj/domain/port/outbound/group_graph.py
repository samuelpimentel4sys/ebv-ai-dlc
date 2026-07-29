from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True, slots=True)
class GroupNode:
    cnpj: str
    name: str
    exposure: float
    level: int = 0


@dataclass(frozen=True, slots=True)
class GroupEdge:
    from_cnpj: str
    to_cnpj: str
    relation: str
    share_pct: float | None = None


@dataclass(frozen=True, slots=True)
class GroupGraphResult:
    root_cnpj: str
    depth: int
    nodes: list[GroupNode]
    edges: list[GroupEdge]
    truncated: bool
    warnings: list[str] = field(default_factory=list)
    backend: str = "stub"
    fetched_at: datetime | None = None

    @property
    def node_count(self) -> int:
        return len(self.nodes)

    @property
    def total_exposure(self) -> float:
        return float(sum(n.exposure for n in self.nodes))


class GroupGraphGateway(Protocol):
    """Port Neptune/Neo4j — lab usa stub determinístico."""

    @property
    def backend_name(self) -> str: ...

    async def health(self) -> bool: ...

    async def fetch_group(
        self,
        root_cnpj: str,
        *,
        depth: int = 3,
        max_nodes: int = 50,
    ) -> GroupGraphResult: ...
