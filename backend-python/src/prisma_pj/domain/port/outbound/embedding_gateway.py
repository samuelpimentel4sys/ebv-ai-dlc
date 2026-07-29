from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(frozen=True, slots=True)
class EmbeddingResult:
    vectors: tuple[tuple[float, ...], ...]
    provider: str
    model: str
    dimensions: int
    latency_ms: int | None = None


@runtime_checkable
class EmbeddingGateway(Protocol):
    """Port outbound — embeddings (RAG F02)."""

    @property
    def provider_name(self) -> str: ...

    @property
    def model_name(self) -> str: ...

    @property
    def dimensions(self) -> int: ...

    async def embed(self, texts: list[str]) -> EmbeddingResult: ...

    async def health(self) -> bool: ...
