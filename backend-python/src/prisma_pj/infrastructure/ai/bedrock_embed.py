from __future__ import annotations

import json
import time

import httpx

from prisma_pj.domain.exception import EmbeddingProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingResult
from prisma_pj.infrastructure.config import Settings


class BedrockEmbedAdapter:
    """Bedrock embeddings via endpoint mock/lab (`BEDROCK_RUNTIME_ENDPOINT`)."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "bedrock"

    @property
    def model_name(self) -> str:
        return self._settings.bedrock_embed_model_id

    @property
    def dimensions(self) -> int:
        return self._settings.bedrock_embed_dims

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.http_timeout_s)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            raise EmbeddingProviderError("texts vazio")
        endpoint = self._settings.bedrock_runtime_endpoint
        if not endpoint:
            raise ProviderNotConfiguredError(
                "BEDROCK_RUNTIME_ENDPOINT vazio — configure mock lab ou AWS SigV4 (staging)"
            )
        started = time.perf_counter()
        client = await self._http()
        vectors: list[tuple[float, ...]] = []
        for text in texts:
            body = {"inputText": text}
            url = f"{endpoint.rstrip('/')}/model/{self.model_name}/invoke"
            try:
                res = await client.post(
                    url,
                    content=json.dumps(body),
                    headers={"Content-Type": "application/json"},
                )
            except httpx.HTTPError as exc:
                raise EmbeddingProviderError(f"Bedrock embed unreachable: {exc}") from exc
            if res.status_code >= 400:
                raise EmbeddingProviderError(f"Bedrock embed {res.status_code}: {res.text[:500]}")
            data = res.json()
            emb = data.get("embedding") or data.get("embeddings")
            if isinstance(emb, list) and emb and isinstance(emb[0], list):
                emb = emb[0]
            if not isinstance(emb, list) or not emb:
                raise EmbeddingProviderError("Bedrock embed empty")
            vectors.append(tuple(float(v) for v in emb))
        dims = len(vectors[0])
        if dims != self.dimensions:
            raise EmbeddingProviderError(
                f"dims mismatch: got {dims}, configured BEDROCK_EMBED_DIMS={self.dimensions}"
            )
        return EmbeddingResult(
            vectors=tuple(vectors),
            provider=self.provider_name,
            model=self.model_name,
            dimensions=dims,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )

    async def health(self) -> bool:
        return bool(self._settings.bedrock_runtime_endpoint)
