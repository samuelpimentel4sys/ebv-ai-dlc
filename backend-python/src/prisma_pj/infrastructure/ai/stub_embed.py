"""Embeddings stub — vetores determinísticos p/ pgvector no showcase."""

from __future__ import annotations

import hashlib
import time

from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingResult
from prisma_pj.infrastructure.ai.vector_utils import l2_normalize
from prisma_pj.infrastructure.config import Settings


def _pseudo_vector(text: str, dims: int) -> tuple[float, ...]:
    """Bag-of-tokens → bins SHA256; similaridade lexical fraca mas estável."""
    vec = [0.0] * dims
    tokens = text.lower().split() or ["_empty_"]
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for offset in range(0, 32, 4):
            idx = int.from_bytes(digest[offset : offset + 4], "big") % dims
            sign = 1.0 if digest[offset] % 2 == 0 else -1.0
            vec[idx] += sign
    return tuple(l2_normalize(vec))


class StubEmbedAdapter:
    """Embeddings sintéticos — dims = RAG_VECTOR_DIMS (canônico 1536)."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._dims = settings.rag_vector_dims

    @property
    def provider_name(self) -> str:
        return "stub"

    @property
    def model_name(self) -> str:
        return "showcase-embed-stub-v1"

    @property
    def dimensions(self) -> int:
        return self._dims

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        started = time.perf_counter()
        vectors = tuple(_pseudo_vector(t, self._dims) for t in texts)
        latency_ms = int((time.perf_counter() - started) * 1000)
        return EmbeddingResult(
            vectors=vectors,
            provider=self.provider_name,
            model=self.model_name,
            dimensions=self._dims,
            latency_ms=latency_ms,
        )

    async def health(self) -> bool:
        return True
