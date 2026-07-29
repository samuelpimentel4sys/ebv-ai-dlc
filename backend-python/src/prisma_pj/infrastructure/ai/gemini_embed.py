from __future__ import annotations

import time

import httpx

from prisma_pj.domain.exception import EmbeddingProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingResult
from prisma_pj.infrastructure.config import Settings


class GeminiEmbedAdapter:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self._settings.gemini_embed_model

    @property
    def dimensions(self) -> int:
        return self._settings.gemini_embed_dims

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

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            raise EmbeddingProviderError("texts vazio")
        key = self._require_key()
        started = time.perf_counter()
        client = await self._http()
        vectors: list[tuple[float, ...]] = []
        for text in texts:
            url = f"{self._base()}/models/{self.model_name}:embedContent"
            try:
                res = await client.post(
                    url,
                    params={"key": key},
                    json={
                        "model": f"models/{self.model_name}",
                        "content": {"parts": [{"text": text}]},
                    },
                )
            except httpx.HTTPError as exc:
                raise EmbeddingProviderError(f"Gemini embed unreachable: {exc}") from exc
            if res.status_code >= 400:
                raise EmbeddingProviderError(f"Gemini embed {res.status_code}: {res.text[:500]}")
            values = (res.json().get("embedding") or {}).get("values")
            if not isinstance(values, list) or not values:
                raise EmbeddingProviderError("Gemini embed empty")
            vectors.append(tuple(float(v) for v in values))
        dims = len(vectors[0])
        if dims != self.dimensions:
            raise EmbeddingProviderError(
                f"dims mismatch: got {dims}, configured GEMINI_EMBED_DIMS={self.dimensions}"
            )
        return EmbeddingResult(
            vectors=tuple(vectors),
            provider=self.provider_name,
            model=self.model_name,
            dimensions=dims,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )

    async def health(self) -> bool:
        return bool(self._settings.gemini_api_key)
