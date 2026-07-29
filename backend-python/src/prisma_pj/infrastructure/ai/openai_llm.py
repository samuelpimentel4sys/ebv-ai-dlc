from __future__ import annotations

import time
from typing import Any

import httpx

from prisma_pj.domain.exception import LlmProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmResult
from prisma_pj.infrastructure.config import Settings


class OpenAiLlmAdapter:
    """OpenAI Chat Completions — análise / eval (sem voz)."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._settings.openai_model

    def _base(self) -> str:
        return self._settings.openai_base_url.rstrip("/")

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.openai_timeout_s)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    def _headers(self) -> dict[str, str]:
        if not self._settings.openai_api_key:
            raise ProviderNotConfiguredError("OPENAI_API_KEY vazio")
        return {
            "Authorization": f"Bearer {self._settings.openai_api_key}",
            "Content-Type": "application/json",
        }

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> LlmResult:
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        started = time.perf_counter()
        client = await self._http()
        try:
            res = await client.post(
                f"{self._base()}/chat/completions",
                json=payload,
                headers=self._headers(),
            )
        except httpx.HTTPError as exc:
            raise LlmProviderError(f"OpenAI unreachable: {exc}") from exc
        if res.status_code >= 400:
            raise LlmProviderError(f"OpenAI {res.status_code}: {res.text[:500]}")
        data = res.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content")
        if not content or not str(content).strip():
            raise LlmProviderError("OpenAI returned empty response")
        usage = data.get("usage") or {}
        return LlmResult(
            content=str(content).strip(),
            provider=self.provider_name,
            model=self.model_name,
            tokens_in=usage.get("prompt_tokens"),
            tokens_out=usage.get("completion_tokens"),
            latency_ms=int((time.perf_counter() - started) * 1000),
        )

    async def health(self) -> bool:
        if not self._settings.openai_api_key:
            return False
        client = await self._http()
        try:
            res = await client.get(
                f"{self._base()}/models",
                headers=self._headers(),
                timeout=5.0,
            )
            return res.is_success
        except (httpx.HTTPError, ProviderNotConfiguredError):
            return False
