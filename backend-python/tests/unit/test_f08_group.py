from __future__ import annotations

import pytest

from prisma_pj.application.use_case.group import _cnpj
from prisma_pj.domain.exception import DomainError
from prisma_pj.infrastructure.graph.stub_neptune import StubNeptuneGateway


@pytest.mark.asyncio
async def test_stub_depth_3_builds_tree() -> None:
    gw = StubNeptuneGateway()
    result = await gw.fetch_group("12345678000199", depth=3, max_nodes=50)
    assert result.depth == 3
    assert result.node_count == 15  # 1 + 2 + 4 + 8
    assert not result.truncated
    assert result.total_exposure > 0
    assert result.backend == "stub"
    assert all(len(n.cnpj) == 14 for n in result.nodes)


@pytest.mark.asyncio
async def test_stub_truncate_warning() -> None:
    gw = StubNeptuneGateway()
    result = await gw.fetch_group("12345678000199", depth=3, max_nodes=5)
    assert result.truncated
    assert result.node_count == 5
    assert any("truncado" in w for w in result.warnings)


@pytest.mark.asyncio
async def test_stub_depth_capped_at_3() -> None:
    gw = StubNeptuneGateway()
    result = await gw.fetch_group("12345678000199", depth=9, max_nodes=100)
    assert result.depth == 3


@pytest.mark.asyncio
async def test_stub_timeout_raises() -> None:
    gw = StubNeptuneGateway(simulate_timeout=True)
    with pytest.raises(DomainError, match="timeout"):
        await gw.fetch_group("12345678000199")


def test_cnpj_invalid() -> None:
    with pytest.raises(DomainError, match="14"):
        _cnpj("123")
