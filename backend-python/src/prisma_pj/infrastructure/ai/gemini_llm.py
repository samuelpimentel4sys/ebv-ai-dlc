from __future__ import annotations

import time
from typing import Any

import httpx

from prisma_pj.domain.exception import LlmProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmResult
from prisma_pj.infrastructure.config import Settings


def _split_system(messages: list[ChatMessage]) -> tuple[str | None, list[dict[str, Any]]]:
    system_parts: list[str] = []
    contents: list[dict[str, Any]] = []
    for msg in messages:
        if msg.role == "system":
            system_parts.append(msg.content)
            continue
        role = "model" if msg.role == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg.content}]})
    system = "\n".join(system_parts) if system_parts else None
    return system, contents


class GeminiLlmAdapter:
    """Google Gemini generateContent — análise / eval (sem voz)."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._settings.gemini_model

    def _base(self) -> str:
        return self._settings.gemini_base_url.rstrip("/")

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.gemini_timeout_s)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    def _require_key(self) -> str:
        if not self._settings.gemini_api_key:
            raise ProviderNotConfiguredError("GEMINI_API_KEY vazio")
        return self._settings.gemini_api_key

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> LlmResult:
        key = self._require_key()
        system, contents = _split_system(messages)
        if not contents:
            raise LlmProviderError("Gemini requer ao menos uma mensagem user")
        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        url = f"{self._base()}/models/{self.model_name}:generateContent"
        started = time.perf_counter()
        client = await self._http()
        try:
            res = await client.post(url, params={"key": key}, json=payload)
        except httpx.HTTPError as exc:
            raise LlmProviderError(f"Gemini unreachable: {exc}") from exc
        if res.status_code >= 400:
            raise LlmProviderError(f"Gemini {res.status_code}: {res.text[:500]}")
        data = res.json()
        candidates = data.get("candidates") or []
        parts = ((candidates[0] or {}).get("content") or {}).get("parts") or []
        text = "".join(str(p.get("text", "")) for p in parts if isinstance(p, dict)).strip()
        if not text:
            raise LlmProviderError("Gemini returned empty response")
        usage = data.get("usageMetadata") or {}
        return LlmResult(
            content=text,
            provider=self.provider_name,
            model=self.model_name,
            tokens_in=usage.get("promptTokenCount"),
            tokens_out=usage.get("candidatesTokenCount"),
            latency_ms=int((time.perf_counter() - started) * 1000),
        )

    async def health(self) -> bool:
        if not self._settings.gemini_api_key:
            return False
        key = self._settings.gemini_api_key
        client = await self._http()
        try:
            res = await client.get(
                f"{self._base()}/models",
                params={"key": key},
                timeout=5.0,
            )
            return res.is_success
        except httpx.HTTPError:
            return False
