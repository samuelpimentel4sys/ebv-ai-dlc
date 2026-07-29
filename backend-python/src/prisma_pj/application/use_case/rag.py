from __future__ import annotations

import re
import uuid
from dataclasses import dataclass

from prisma_pj.domain.exception import DomainError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingGateway
from prisma_pj.domain.port.outbound.rag_repository import (
    LibraryDocument,
    LibraryRepository,
    RagChunkHit,
    RagChunkIn,
    RagChunkRepository,
)

_CNPJ_RE = re.compile(r"^\d{14}$")
_ALLOWED_DOC_TYPES = frozenset(
    {"BALANCO", "DRE", "DFC", "CONTRATO", "ATA", "OUTRO", "DEMONSTRATIVO"}
)


def _require_cnpj(cnpj: str) -> str:
    normalized = cnpj.strip()
    if not _CNPJ_RE.match(normalized):
        raise DomainError("CNPJ deve ter 14 dígitos (RN001)")
    return normalized


@dataclass(frozen=True, slots=True)
class IndexChunkPayload:
    page: int
    start: int
    end: int
    content: str


@dataclass(frozen=True, slots=True)
class IndexRagCommand:
    cnpj: str
    document_id: uuid.UUID
    chunks: list[IndexChunkPayload]


@dataclass(frozen=True, slots=True)
class QueryRagCommand:
    cnpj: str
    query: str
    top_k: int = 8


class IndexRagDocument:
    def __init__(
        self,
        repository: RagChunkRepository,
        embeddings: EmbeddingGateway,
        *,
        index_version: str,
        canonical_dims: int,
    ) -> None:
        self._repository = repository
        self._embeddings = embeddings
        self._index_version = index_version
        self._canonical_dims = canonical_dims

    async def execute(self, command: IndexRagCommand) -> dict[str, object]:
        cnpj = _require_cnpj(command.cnpj)
        if not command.chunks:
            raise DomainError("chunks vazio")
        texts = [c.content for c in command.chunks]
        embedded = await self._embeddings.embed(texts)
        rag_chunks: list[RagChunkIn] = []
        for raw, vector in zip(command.chunks, embedded.vectors, strict=True):
            rag_chunks.append(
                RagChunkIn(
                    document_id=command.document_id,
                    page=raw.page,
                    start_offset=raw.start,
                    end_offset=raw.end,
                    content=raw.content,
                    embedding=vector,
                )
            )
        count = await self._repository.replace_document_chunks(
            cnpj=cnpj,
            document_id=command.document_id,
            chunks=rag_chunks,
            embedding_model=embedded.model,
            embedding_dims=embedded.dimensions,
            index_version=self._index_version,
            provider=embedded.provider,
            canonical_dims=self._canonical_dims,
        )
        return {
            "cnpj": cnpj,
            "documentId": str(command.document_id),
            "chunksIndexed": count,
            "indexVersion": self._index_version,
            "embeddingModel": embedded.model,
            "provider": embedded.provider,
        }


class QueryRag:
    def __init__(
        self,
        repository: RagChunkRepository,
        embeddings: EmbeddingGateway,
        *,
        index_version: str,
        canonical_dims: int,
    ) -> None:
        self._repository = repository
        self._embeddings = embeddings
        self._index_version = index_version
        self._canonical_dims = canonical_dims

    async def execute(self, command: QueryRagCommand) -> dict[str, object]:
        cnpj = _require_cnpj(command.cnpj)
        if not command.query.strip():
            raise DomainError("query obrigatória")
        top_k = max(1, min(command.top_k, 32))
        embedded = await self._embeddings.embed([command.query])
        hits = await self._repository.similarity_search(
            cnpj=cnpj,
            query_embedding=embedded.vectors[0],
            index_version=self._index_version,
            top_k=top_k,
            canonical_dims=self._canonical_dims,
        )
        answer_id = await self._repository.save_answer_with_citations(
            cnpj=cnpj,
            query_text=command.query,
            model=embedded.model,
            provider=embedded.provider,
            hits=hits,
        )
        return {
            "answerId": str(answer_id),
            "cnpj": cnpj,
            "chunks": [
                {
                    "chunkId": str(h.chunk_id),
                    "documentId": str(h.document_id),
                    "page": h.page,
                    "start": h.start_offset,
                    "end": h.end_offset,
                    "score": round(h.score, 6),
                    "excerpt": h.content,
                }
                for h in hits
            ],
        }


class GetRagCitations:
    def __init__(self, repository: RagChunkRepository) -> None:
        self._repository = repository

    async def execute(self, answer_id: uuid.UUID) -> list[RagChunkHit]:
        return await self._repository.list_citations(answer_id)


@dataclass(frozen=True, slots=True)
class CreateLibraryCommand:
    cnpj: str
    doc_type: str
    filename: str
    storage_uri: str
    retention_until: str


class CreateLibraryDocument:
    def __init__(self, repository: LibraryRepository) -> None:
        self._repository = repository

    async def execute(self, command: CreateLibraryCommand) -> LibraryDocument:
        cnpj = _require_cnpj(command.cnpj)
        doc_type = command.doc_type.strip().upper()
        if doc_type not in _ALLOWED_DOC_TYPES:
            raise DomainError(f"docType inválido (RN004): {doc_type}")
        doc = LibraryDocument(
            id=uuid.uuid4(),
            cnpj=cnpj,
            doc_type=doc_type,
            filename=command.filename,
            storage_uri=command.storage_uri,
            retention_until=command.retention_until,
            legal_hold=False,
            status="STORED",
        )
        return await self._repository.create(doc)


class ListLibraryByCnpj:
    def __init__(self, repository: LibraryRepository) -> None:
        self._repository = repository

    async def execute(self, cnpj: str) -> list[LibraryDocument]:
        return await self._repository.list_by_cnpj(_require_cnpj(cnpj))


class DeleteLibraryDocument:
    def __init__(self, repository: LibraryRepository) -> None:
        self._repository = repository

    async def execute(self, doc_id: uuid.UUID) -> None:
        await self._repository.delete(doc_id)
