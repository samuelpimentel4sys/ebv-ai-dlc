from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass(frozen=True, slots=True)
class RagChunkIn:
    document_id: uuid.UUID
    page: int
    start_offset: int
    end_offset: int
    content: str
    embedding: tuple[float, ...]


@dataclass(frozen=True, slots=True)
class RagChunkHit:
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    page: int
    start_offset: int
    end_offset: int
    content: str
    score: float


@dataclass(frozen=True, slots=True)
class LibraryDocument:
    id: uuid.UUID
    cnpj: str
    doc_type: str
    filename: str
    storage_uri: str
    retention_until: str
    legal_hold: bool
    status: str


@runtime_checkable
class RagChunkRepository(Protocol):
    async def replace_document_chunks(
        self,
        *,
        cnpj: str,
        document_id: uuid.UUID,
        chunks: list[RagChunkIn],
        embedding_model: str,
        embedding_dims: int,
        index_version: str,
        provider: str,
        canonical_dims: int,
    ) -> int: ...

    async def similarity_search(
        self,
        *,
        cnpj: str,
        query_embedding: tuple[float, ...],
        index_version: str,
        top_k: int,
        canonical_dims: int,
    ) -> list[RagChunkHit]: ...

    async def save_answer_with_citations(
        self,
        *,
        cnpj: str,
        query_text: str,
        model: str | None,
        provider: str | None,
        hits: list[RagChunkHit],
    ) -> uuid.UUID: ...

    async def list_citations(self, answer_id: uuid.UUID) -> list[RagChunkHit]: ...


@runtime_checkable
class LibraryRepository(Protocol):
    async def create(self, doc: LibraryDocument) -> LibraryDocument: ...

    async def list_by_cnpj(self, cnpj: str) -> list[LibraryDocument]: ...

    async def delete(self, doc_id: uuid.UUID, *, allow_legal_hold: bool = False) -> None: ...
