from __future__ import annotations

import time

import httpx

from prisma_pj.domain.exception import EmbeddingProviderError, ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingResult
from prisma_pj.infrastructure.config import Settings


class OllamaEmbedAdapter:
    """Embeddings Ollama (`POST /api/embeddings`)."""

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None

    @property
    def provider_name(self) -> str:
        return "local"

    @property
    def model_name(self) -> str:
        return self._settings.ollama_embed_model

    @property
    def dimensions(self) -> int:
        return self._settings.ollama_embed_dims

    def _root(self) -> str:
        return self._settings.local_llm_base_url.rstrip("/").removesuffix("/v1")

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.local_llm_timeout_s)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            raise EmbeddingProviderError("texts vazio")
        if not self._settings.local_llm_base_url:
            raise ProviderNotConfiguredError("LOCAL_LLM_BASE_URL vazio")
        started = time.perf_counter()
        client = await self._http()
        vectors: list[tuple[float, ...]] = []
        for text in texts:
            try:
                res = await client.post(
                    f"{self._root()}/api/embeddings",
                    json={"model": self.model_name, "prompt": text},
                )
            except httpx.HTTPError as exc:
                raise EmbeddingProviderError(f"Ollama embed unreachable: {exc}") from exc
            if res.status_code >= 400:
                raise EmbeddingProviderError(f"Ollama embed {res.status_code}: {res.text[:500]}")
            emb = res.json().get("embedding")
            if not isinstance(emb, list) or not emb:
                raise EmbeddingProviderError("Ollama embed empty")
            vectors.append(tuple(float(x) for x in emb))
        dims = len(vectors[0])
        if dims != self.dimensions:
            # não silenciar — RN004 indexVersion depende de dims declarados
            raise EmbeddingProviderError(
                f"dims mismatch: got {dims}, configured OLLAMA_EMBED_DIMS={self.dimensions}"
            )
        latency_ms = int((time.perf_counter() - started) * 1000)
        return EmbeddingResult(
            vectors=tuple(vectors),
            provider=self.provider_name,
            model=self.model_name,
            dimensions=dims,
            latency_ms=latency_ms,
        )

    async def health(self) -> bool:
        client = await self._http()
        try:
            res = await client.get(f"{self._root()}/api/tags", timeout=5.0)
            return res.is_success
        except httpx.HTTPError:
            return False
