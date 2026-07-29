from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from prisma_pj.domain.port.outbound.group_graph import (
    GroupEdge,
    GroupGraphResult,
    GroupNode,
)


class StubNeptuneGateway:
    """
    Stub até Neptune/EP-04 (D6).

    Gera árvore societária determinística (2 filhos/nível) a partir do CNPJ raiz.
    """

    def __init__(self, *, simulate_timeout: bool = False) -> None:
        self._simulate_timeout = simulate_timeout

    @property
    def backend_name(self) -> str:
        return "stub"

    async def health(self) -> bool:
        return not self._simulate_timeout

    async def fetch_group(
        self,
        root_cnpj: str,
        *,
        depth: int = 3,
        max_nodes: int = 50,
    ) -> GroupGraphResult:
        if self._simulate_timeout:
            from prisma_pj.domain.exception import DomainError

            raise DomainError("Neptune timeout")

        depth = max(1, min(depth, 3))  # RN001
        warnings: list[str] = []
        nodes: list[GroupNode] = [
            GroupNode(
                cnpj=root_cnpj,
                name=f"Empresa {root_cnpj[:8]}",
                exposure=_exposure(root_cnpj),
                level=0,
            )
        ]
        edges: list[GroupEdge] = []
        frontier = [root_cnpj]
        truncated = False

        for level in range(1, depth + 1):
            next_frontier: list[str] = []
            for parent in frontier:
                for idx in (1, 2):
                    if len(nodes) >= max_nodes:
                        truncated = True
                        warnings.append(
                            f"Grafo truncado em {max_nodes} nos (depth={depth})"
                        )
                        break
                    child = _child_cnpj(parent, idx)
                    if any(n.cnpj == child for n in nodes):
                        continue
                    share = 50.0 if idx == 1 else 30.0
                    nodes.append(
                        GroupNode(
                            cnpj=child,
                            name=f"Relacionada L{level}-{idx}",
                            exposure=_exposure(child),
                            level=level,
                        )
                    )
                    edges.append(
                        GroupEdge(
                            from_cnpj=parent,
                            to_cnpj=child,
                            relation="PARTICIPACAO",
                            share_pct=share,
                        )
                    )
                    next_frontier.append(child)
                if truncated:
                    break
            if truncated:
                break
            frontier = next_frontier
            if not frontier:
                break

        return GroupGraphResult(
            root_cnpj=root_cnpj,
            depth=depth,
            nodes=nodes,
            edges=edges,
            truncated=truncated,
            warnings=warnings,
            backend=self.backend_name,
            fetched_at=datetime.now(UTC),
        )


def _child_cnpj(parent: str, idx: int) -> str:
    seed = int(hashlib.sha256(f"{parent}:{idx}".encode()).hexdigest()[:12], 16)
    return f"{seed % 10**14:014d}"


def _exposure(cnpj: str) -> float:
    seed = int(hashlib.sha256(cnpj.encode()).hexdigest()[:8], 16)
    return float(500_000 + (seed % 50) * 100_000)
