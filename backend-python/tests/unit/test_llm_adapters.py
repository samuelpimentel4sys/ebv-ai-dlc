from __future__ import annotations

import httpx
import pytest
import respx

from prisma_pj.application.use_case.smoke_llm import SmokeLlm, SmokeLlmCommand
from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage
from prisma_pj.infrastructure.ai.factory import build_embedding_gateway, build_llm_gateway
from prisma_pj.infrastructure.ai.ollama_llm import OllamaLlmAdapter
from prisma_pj.infrastructure.ai.openai_llm import OpenAiLlmAdapter
from prisma_pj.infrastructure.config import Settings
from prisma_pj.presentation.main import create_app


@pytest.fixture
def local_settings() -> Settings:
    return Settings(
        inference_provider="local",
        local_llm_base_url="http://ollama.test/v1",
        local_llm_model="qwen2.5:7b",
        ollama_embed_model="nomic-embed-text",
        ollama_embed_dims=3,
    )


@pytest.mark.asyncio
@respx.mock
async def test_ollama_complete_ok(local_settings: Settings) -> None:
    respx.post("http://ollama.test/v1/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": "  ok prisma  "}}],
                "usage": {"prompt_tokens": 10, "completion_tokens": 2},
            },
        )
    )
    adapter = OllamaLlmAdapter(local_settings)
    result = await adapter.complete([ChatMessage(role="user", content="ping")])
    assert result.content == "ok prisma"
    assert result.provider == "local"
    assert result.tokens_out == 2
    await adapter.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_ollama_health(local_settings: Settings) -> None:
    respx.get("http://ollama.test/api/tags").mock(
        return_value=httpx.Response(200, json={"models": []})
    )
    adapter = OllamaLlmAdapter(local_settings)
    assert await adapter.health() is True
    await adapter.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_openai_complete_ok() -> None:
    settings = Settings(
        inference_provider="openai",
        openai_api_key="sk-test",
        openai_base_url="http://openai.test/v1",
        openai_model="gpt-4o-mini",
    )
    respx.post("http://openai.test/v1/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "choices": [{"message": {"content": "análise ok"}}],
                "usage": {"prompt_tokens": 5, "completion_tokens": 3},
            },
        )
    )
    adapter = OpenAiLlmAdapter(settings)
    result = await adapter.complete([ChatMessage(role="user", content="x")])
    assert result.provider == "openai"
    assert "análise" in result.content
    await adapter.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_smoke_use_case(local_settings: Settings) -> None:
    respx.post("http://ollama.test/v1/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={"choices": [{"message": {"content": "frase"}}], "usage": {}},
        )
    )
    uc = SmokeLlm(OllamaLlmAdapter(local_settings))
    out = await uc.execute(SmokeLlmCommand(prompt="teste"))
    assert out.content == "frase"


def test_factory_selects_local(local_settings: Settings) -> None:
    llm = build_llm_gateway(local_settings)
    emb = build_embedding_gateway(local_settings)
    assert llm.provider_name == "local"
    assert emb.provider_name == "local"
    assert emb.dimensions == 3


def test_factory_selects_gemini() -> None:
    settings = Settings(inference_provider="gemini", gemini_api_key="x")
    assert build_llm_gateway(settings).provider_name == "gemini"
    assert build_embedding_gateway(settings).provider_name == "gemini"


def test_factory_selects_bedrock() -> None:
    settings = Settings(
        inference_provider="bedrock",
        bedrock_runtime_endpoint="http://bedrock.mock",
    )
    assert build_llm_gateway(settings).provider_name == "bedrock"
    assert build_embedding_gateway(settings).provider_name == "bedrock"


@pytest.mark.asyncio
async def test_health_endpoint() -> None:
    app = create_app()
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
@respx.mock
async def test_ollama_embed_ok(local_settings: Settings) -> None:
    from prisma_pj.infrastructure.ai.ollama_embed import OllamaEmbedAdapter

    respx.post("http://ollama.test/api/embeddings").mock(
        return_value=httpx.Response(200, json={"embedding": [0.1, 0.2, 0.3]})
    )
    adapter = OllamaEmbedAdapter(local_settings)
    result = await adapter.embed(["texto"])
    assert result.dimensions == 3
    assert len(result.vectors[0]) == 3
    await adapter.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_gemini_complete_ok() -> None:
    from prisma_pj.infrastructure.ai.gemini_llm import GeminiLlmAdapter

    settings = Settings(
        inference_provider="gemini",
        gemini_api_key="gk-test",
        gemini_base_url="http://gemini.test/v1beta",
        gemini_model="gemini-2.5-flash",
    )
    respx.post(url__regex=r".*/models/gemini-2.5-flash:generateContent.*").mock(
        return_value=httpx.Response(
            200,
            json={
                "candidates": [{"content": {"parts": [{"text": "gemini ok"}]}}],
                "usageMetadata": {"promptTokenCount": 1, "candidatesTokenCount": 2},
            },
        )
    )
    adapter = GeminiLlmAdapter(settings)
    result = await adapter.complete([ChatMessage(role="user", content="oi")])
    assert result.content == "gemini ok"
    assert result.provider == "gemini"
    await adapter.aclose()


@pytest.mark.asyncio
@respx.mock
async def test_bedrock_complete_ok() -> None:
    from prisma_pj.infrastructure.ai.bedrock_llm import BedrockLlmAdapter

    settings = Settings(
        inference_provider="bedrock",
        bedrock_runtime_endpoint="http://bedrock.test",
        bedrock_chat_model_id="anthropic.claude-3-haiku-20240307-v1:0",
    )
    model = settings.bedrock_chat_model_id
    respx.post(f"http://bedrock.test/model/{model}/invoke").mock(
        return_value=httpx.Response(
            200,
            json={
                "content": [{"text": "bedrock ok"}],
                "usage": {"input_tokens": 1, "output_tokens": 2},
            },
        )
    )
    adapter = BedrockLlmAdapter(settings)
    result = await adapter.complete([ChatMessage(role="user", content="oi")])
    assert result.content == "bedrock ok"
    assert result.provider == "bedrock"
    await adapter.aclose()
