from __future__ import annotations

import math

import httpx
import pytest

from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage
from prisma_pj.infrastructure.ai.factory import build_embedding_gateway, build_llm_gateway
from prisma_pj.infrastructure.ai.stub_embed import StubEmbedAdapter, _pseudo_vector
from prisma_pj.infrastructure.ai.stub_llm import StubLlmAdapter
from prisma_pj.infrastructure.config import Settings
from prisma_pj.presentation.main import create_app


def test_showcase_settings_force_stub() -> None:
    s = Settings(
        showcase_mode=True,
        inference_provider="local",
        oidc_enabled=True,
        rag_index_version="v1-local-nomic-768pad",
    )
    assert s.showcase_mode is True
    assert s.inference_provider == "stub"
    assert s.oidc_enabled is False
    assert s.rag_index_version == "v1-showcase-stub"


def test_factory_showcase_selects_stub() -> None:
    s = Settings(showcase_mode=True, rag_vector_dims=8)
    llm = build_llm_gateway(s)
    emb = build_embedding_gateway(s)
    assert llm.provider_name == "stub"
    assert emb.provider_name == "stub"
    assert emb.dimensions == 8


def test_factory_provider_stub_without_flag() -> None:
    s = Settings(showcase_mode=False, inference_provider="stub", rag_vector_dims=4)
    assert build_llm_gateway(s).provider_name == "stub"
    assert build_embedding_gateway(s).provider_name == "stub"


@pytest.mark.asyncio
async def test_stub_llm_section_and_smoke() -> None:
    adapter = StubLlmAdapter(Settings(showcase_mode=True))
    opinion = await adapter.complete(
        [
            ChatMessage(role="system", content="analista"),
            ChatMessage(
                role="user",
                content="Escreva a seção RESUMO de um parecer de crédito PJ em português.",
            ),
        ]
    )
    assert "SHOWCASE" in opinion.content
    assert opinion.provider == "stub"
    assert await adapter.health() is True

    echo = await adapter.complete([ChatMessage(role="user", content="ping demo")])
    assert "SHOWCASE" in echo.content
    assert "ping demo" in echo.content


@pytest.mark.asyncio
async def test_stub_embed_dims_and_deterministic() -> None:
    settings = Settings(showcase_mode=True, rag_vector_dims=16)
    adapter = StubEmbedAdapter(settings)
    a = await adapter.embed(["caixa liquidez margem"])
    b = await adapter.embed(["caixa liquidez margem"])
    assert a.dimensions == 16
    assert len(a.vectors[0]) == 16
    assert a.vectors == b.vectors
    norm = math.sqrt(sum(v * v for v in a.vectors[0]))
    assert abs(norm - 1.0) < 1e-6
    assert await adapter.health() is True


def test_pseudo_vector_stable() -> None:
    v1 = _pseudo_vector("alpha beta", 8)
    v2 = _pseudo_vector("alpha beta", 8)
    assert v1 == v2


@pytest.mark.asyncio
async def test_health_shows_showcase_mode() -> None:
    from prisma_pj.infrastructure.config import get_settings

    app = create_app()
    app.dependency_overrides[get_settings] = lambda: Settings(showcase_mode=True)
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    app.dependency_overrides.clear()
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body.get("mode") == "showcase"
