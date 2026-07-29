from __future__ import annotations

import time

import httpx

from prisma_pj.domain.exception import EmbeddingProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingResult
from prisma_pj.infrastructure.config import Settings


class OpenAiEmbedAdapter:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._settings.openai_embed_model

    @property
    def dimensions(self) -> int:
        return self._settings.openai_embed_dims

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

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            raise EmbeddingProviderError("texts vazio")
        started = time.perf_counter()
        client = await self._http()
        try:
            res = await client.post(
                f"{self._base()}/embeddings",
                headers=self._headers(),
                json={"model": self.model_name, "input": texts},
            )
        except httpx.HTTPError as exc:
            raise EmbeddingProviderError(f"OpenAI embed unreachable: {exc}") from exc
        if res.status_code >= 400:
            raise EmbeddingProviderError(f"OpenAI embed {res.status_code}: {res.text[:500]}")
        data = res.json()
        items = sorted(data.get("data") or [], key=lambda x: x.get("index", 0))
        vectors = [tuple(float(v) for v in item["embedding"]) for item in items]
        if not vectors:
            raise EmbeddingProviderError("OpenAI embed empty")
        dims = len(vectors[0])
        if dims != self.dimensions:
            raise EmbeddingProviderError(
                f"dims mismatch: got {dims}, configured OPENAI_EMBED_DIMS={self.dimensions}"
            )
        return EmbeddingResult(
            vectors=tuple(vectors),
            provider=self.provider_name,
            model=self.model_name,
            dimensions=dims,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )

    async def health(self) -> bool:
        return bool(self._settings.openai_api_key)
