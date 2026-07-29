from __future__ import annotations

import uuid
from dataclasses import dataclass, field

import pytest

from prisma_pj.application.use_case.rag import (
    CreateLibraryCommand,
    CreateLibraryDocument,
    IndexChunkPayload,
    IndexRagCommand,
    IndexRagDocument,
    QueryRag,
    QueryRagCommand,
)
from prisma_pj.domain.exception import DomainError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingResult
from prisma_pj.domain.port.outbound.rag_repository import (
    LibraryDocument,
    RagChunkHit,
    RagChunkIn,
)
from prisma_pj.infrastructure.ai.vector_utils import pad_or_trim


def test_pad_or_trim() -> None:
    assert len(pad_or_trim([1.0, 2.0], 4)) == 4
    assert pad_or_trim([1.0, 2.0, 3.0, 4.0], 2) == [1.0, 2.0]


class FakeEmbed:
    provider_name = "local"
    model_name = "fake-embed"
    dimensions = 3

    async def embed(self, texts: list[str]) -> EmbeddingResult:
        vectors = []
        for i, _ in enumerate(texts):
            vectors.append((0.1 + i * 0.01, 0.2, 0.3))
        return EmbeddingResult(
            vectors=tuple(vectors),
            provider=self.provider_name,
            model=self.model_name,
            dimensions=self.dimensions,
        )

    async def health(self) -> bool:
        return True


@dataclass
class FakeRagRepo:
    chunks: list[tuple[str, RagChunkIn, str]] = field(default_factory=list)
    answers: dict[uuid.UUID, list[RagChunkHit]] = field(default_factory=dict)

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
    ) -> int:
        self.chunks = [(cnpj, c, index_version) for c in chunks]
        assert all(len(pad_or_trim(c.embedding, canonical_dims)) == canonical_dims for c in chunks)
        return len(chunks)

    async def similarity_search(
        self,
        *,
        cnpj: str,
        query_embedding: tuple[float, ...],
        index_version: str,
        top_k: int,
        canonical_dims: int,
    ) -> list[RagChunkHit]:
        hits = [
            RagChunkHit(
                chunk_id=uuid.uuid4(),
                document_id=c.document_id,
                page=c.page,
                start_offset=c.start_offset,
                end_offset=c.end_offset,
                content=c.content,
                score=0.9,
            )
            for stored_cnpj, c, ver in self.chunks
            if stored_cnpj == cnpj and ver == index_version
        ]
        return hits[:top_k]

    async def save_answer_with_citations(
        self,
        *,
        cnpj: str,
        query_text: str,
        model: str | None,
        provider: str | None,
        hits: list[RagChunkHit],
    ) -> uuid.UUID:
        aid = uuid.uuid4()
        self.answers[aid] = hits
        return aid

    async def list_citations(self, answer_id: uuid.UUID) -> list[RagChunkHit]:
        return self.answers.get(answer_id, [])


@dataclass
class FakeLibraryRepo:
    docs: list[LibraryDocument] = field(default_factory=list)

    async def create(self, doc: LibraryDocument) -> LibraryDocument:
        self.docs.append(doc)
        return doc

    async def list_by_cnpj(self, cnpj: str) -> list[LibraryDocument]:
        return [d for d in self.docs if d.cnpj == cnpj]

    async def delete(self, doc_id: uuid.UUID, *, allow_legal_hold: bool = False) -> None:
        self.docs = [d for d in self.docs if d.id != doc_id]


@pytest.mark.asyncio
async def test_index_and_query_isolates_cnpj() -> None:
    repo = FakeRagRepo()
    uc_index = IndexRagDocument(repo, FakeEmbed(), index_version="v1", canonical_dims=1536)
    doc_id = uuid.uuid4()
    await uc_index.execute(
        IndexRagCommand(
            cnpj="12345678000199",
            document_id=doc_id,
            chunks=[
                IndexChunkPayload(page=1, start=0, end=10, content="margem 5%"),
            ],
        )
    )
    uc_query = QueryRag(repo, FakeEmbed(), index_version="v1", canonical_dims=1536)
    result = await uc_query.execute(QueryRagCommand(cnpj="12345678000199", query="margem", top_k=5))
    assert result["cnpj"] == "12345678000199"
    assert len(result["chunks"]) == 1  # type: ignore[arg-type]

    empty = await uc_query.execute(QueryRagCommand(cnpj="99999999000191", query="margem", top_k=5))
    assert empty["chunks"] == []


@pytest.mark.asyncio
async def test_index_requires_cnpj() -> None:
    uc = IndexRagDocument(FakeRagRepo(), FakeEmbed(), index_version="v1", canonical_dims=1536)
    with pytest.raises(DomainError, match="CNPJ"):
        await uc.execute(
            IndexRagCommand(
                cnpj="123",
                document_id=uuid.uuid4(),
                chunks=[IndexChunkPayload(page=1, start=0, end=1, content="x")],
            )
        )


@pytest.mark.asyncio
async def test_library_create_validates_doc_type() -> None:
    uc = CreateLibraryDocument(FakeLibraryRepo())
    with pytest.raises(DomainError, match="docType"):
        await uc.execute(
            CreateLibraryCommand(
                cnpj="12345678000199",
                doc_type="XYZ",
                filename="a.pdf",
                storage_uri="s3://x",
                retention_until="2030-01-01",
            )
        )
    doc = await uc.execute(
        CreateLibraryCommand(
            cnpj="12345678000199",
            doc_type="BALANCO",
            filename="a.pdf",
            storage_uri="s3://x",
            retention_until="2030-01-01",
        )
    )
    assert doc.status == "STORED"
