from __future__ import annotations

import json
import time
from typing import Any

import httpx

from prisma_pj.domain.exception import LlmProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmResult
from prisma_pj.infrastructure.config import Settings


class BedrockLlmAdapter:
    """
    Amazon Bedrock Runtime — path prod EBV.

    Usa endpoint HTTP InvokeModel quando `BEDROCK_RUNTIME_ENDPOINT` está setado
    (mock/lab). Em AWS real, o adapter assina SigV4 via boto3 (opcional — P0
    entrega contrato + mock; instalar boto3 no sprint de staging).
    """

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "bedrock"

    @property
    def model_name(self) -> str:
        return self._settings.bedrock_chat_model_id

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.http_timeout_s)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    def _messages_to_anthropic(self, messages: list[ChatMessage]) -> dict[str, Any]:
        system_parts: list[str] = []
        anth_msgs: list[dict[str, str]] = []
        for msg in messages:
            if msg.role == "system":
                system_parts.append(msg.content)
            else:
                anth_msgs.append({"role": msg.role, "content": msg.content})
        body: dict[str, Any] = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "messages": anth_msgs or [{"role": "user", "content": " "}],
        }
        if system_parts:
            body["system"] = "\n".join(system_parts)
        return body

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> LlmResult:
        endpoint = self._settings.bedrock_runtime_endpoint
        if not endpoint:
            raise ProviderNotConfiguredError(
                "BEDROCK_RUNTIME_ENDPOINT vazio — configure mock lab ou AWS SigV4 (staging)"
            )
        body = self._messages_to_anthropic(messages)
        body["max_tokens"] = max_tokens
        body["temperature"] = temperature
        started = time.perf_counter()
        client = await self._http()
        url = f"{endpoint.rstrip('/')}/model/{self.model_name}/invoke"
        try:
            res = await client.post(
                url,
                content=json.dumps(body),
                headers={"Content-Type": "application/json"},
            )
        except httpx.HTTPError as exc:
            raise LlmProviderError(f"Bedrock unreachable: {exc}") from exc
        if res.status_code >= 400:
            raise LlmProviderError(f"Bedrock {res.status_code}: {res.text[:500]}")
        data = res.json()
        # Anthropic on Bedrock: content[].text
        content_blocks = data.get("content") or []
        text = "".join(
            str(b.get("text", "")) for b in content_blocks if isinstance(b, dict)
        ).strip()
        if not text and isinstance(data.get("completion"), str):
            text = data["completion"].strip()
        if not text:
            raise LlmProviderError("Bedrock returned empty response")
        usage = data.get("usage") or {}
        return LlmResult(
            content=text,
            provider=self.provider_name,
            model=self.model_name,
            tokens_in=usage.get("input_tokens"),
            tokens_out=usage.get("output_tokens"),
            latency_ms=int((time.perf_counter() - started) * 1000),
        )

    async def health(self) -> bool:
        if not self._settings.bedrock_runtime_endpoint:
            return False
        client = await self._http()
        try:
            res = await client.get(
                f"{self._settings.bedrock_runtime_endpoint.rstrip('/')}/health",
                timeout=5.0,
            )
            return res.is_success
        except httpx.HTTPError:
            return False
