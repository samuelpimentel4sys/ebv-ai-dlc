from __future__ import annotations

import time
from typing import Any

import httpx

from prisma_pj.domain.exception import LlmProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmResult
from prisma_pj.infrastructure.config import Settings


class OllamaLlmAdapter:
    """Ollama via API OpenAI-compat (`/v1/chat/completions`) — padrão Jarvis."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "local"

    @property
    def model_name(self) -> str:
        return self._settings.local_llm_model

    def _base(self) -> str:
        return self._settings.local_llm_base_url.rstrip("/")

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.local_llm_timeout_s)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> LlmResult:
        if not self._settings.local_llm_base_url:
            raise ProviderNotConfiguredError("LOCAL_LLM_BASE_URL vazio")
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        started = time.perf_counter()
        client = await self._http()
        try:
            res = await client.post(f"{self._base()}/chat/completions", json=payload)
        except httpx.HTTPError as exc:
            raise LlmProviderError(f"Ollama unreachable: {exc}") from exc
        if res.status_code >= 400:
            raise LlmProviderError(f"Ollama {res.status_code}: {res.text[:500]}")
        data = res.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content")
        if not content or not str(content).strip():
            raise LlmProviderError("Ollama returned empty response")
        usage = data.get("usage") or {}
        latency_ms = int((time.perf_counter() - started) * 1000)
        return LlmResult(
            content=str(content).strip(),
            provider=self.provider_name,
            model=self.model_name,
            tokens_in=usage.get("prompt_tokens"),
            tokens_out=usage.get("completion_tokens"),
            latency_ms=latency_ms,
        )

    async def health(self) -> bool:
        base = self._base().removesuffix("/v1")
        client = await self._http()
        try:
            res = await client.get(f"{base}/api/tags", timeout=5.0)
            return res.is_success
        except httpx.HTTPError:
            return False
