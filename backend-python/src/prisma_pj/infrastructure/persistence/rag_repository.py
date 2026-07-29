from __future__ import annotations

import uuid

from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.domain.exception import DomainError
from prisma_pj.domain.port.outbound.rag_repository import (
    LibraryDocument,
    RagChunkHit,
    RagChunkIn,
)
from prisma_pj.infrastructure.ai.vector_utils import l2_normalize, pad_or_trim
from prisma_pj.infrastructure.persistence.model import (
    PjLibraryDocumentRow,
    PjRagAnswerRow,
    PjRagChunkRow,
    PjRagCitationRow,
)


class SqlAlchemyRagChunkRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

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
        await self._session.execute(
            delete(PjRagChunkRow).where(
                PjRagChunkRow.cnpj == cnpj,
                PjRagChunkRow.document_id == document_id,
            )
        )
        for chunk in chunks:
            emb = l2_normalize(pad_or_trim(chunk.embedding, canonical_dims))
            self._session.add(
                PjRagChunkRow(
                    id=uuid.uuid4(),
                    cnpj=cnpj,
                    document_id=document_id,
                    page=chunk.page,
                    start_offset=chunk.start_offset,
                    end_offset=chunk.end_offset,
                    content=chunk.content,
                    embedding=emb,
                    embedding_model=embedding_model,
                    embedding_dims=embedding_dims,
                    index_version=index_version,
                    provider=provider,
                )
            )
        await self._session.commit()
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
        emb = l2_normalize(pad_or_trim(query_embedding, canonical_dims))
        # cosine distance <=> ; score = 1 - distance
        stmt = (
            select(
                PjRagChunkRow,
                (1 - PjRagChunkRow.embedding.cosine_distance(emb)).label("score"),
            )
            .where(
                PjRagChunkRow.cnpj == cnpj,
                PjRagChunkRow.index_version == index_version,
            )
            .order_by(PjRagChunkRow.embedding.cosine_distance(emb))
            .limit(top_k)
        )
        rows = (await self._session.execute(stmt)).all()
        hits: list[RagChunkHit] = []
        for row, score in rows:
            chunk: PjRagChunkRow = row
            if chunk.page < 0 or chunk.start_offset < 0 or chunk.end_offset <= chunk.start_offset:
                continue  # RN002 — sem origem descartado
            hits.append(
                RagChunkHit(
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    page=chunk.page,
                    start_offset=chunk.start_offset,
                    end_offset=chunk.end_offset,
                    content=chunk.content,
                    score=float(score),
                )
            )
        return hits

    async def save_answer_with_citations(
        self,
        *,
        cnpj: str,
        query_text: str,
        model: str | None,
        provider: str | None,
        hits: list[RagChunkHit],
    ) -> uuid.UUID:
        answer_id = uuid.uuid4()
        self._session.add(
            PjRagAnswerRow(
                id=answer_id,
                cnpj=cnpj,
                query_text=query_text,
                model=model,
                provider=provider,
            )
        )
        for hit in hits:
            self._session.add(
                PjRagCitationRow(
                    id=uuid.uuid4(),
                    answer_id=answer_id,
                    chunk_id=hit.chunk_id,
                    score=hit.score,
                )
            )
        await self._session.commit()
        return answer_id

    async def list_citations(self, answer_id: uuid.UUID) -> list[RagChunkHit]:
        stmt = (
            select(PjRagCitationRow, PjRagChunkRow)
            .join(PjRagChunkRow, PjRagChunkRow.id == PjRagCitationRow.chunk_id)
            .where(PjRagCitationRow.answer_id == answer_id)
            .order_by(PjRagCitationRow.score.desc())
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            RagChunkHit(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                page=chunk.page,
                start_offset=chunk.start_offset,
                end_offset=chunk.end_offset,
                content=chunk.content,
                score=float(citation.score),
            )
            for citation, chunk in rows
        ]


class SqlAlchemyLibraryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, doc: LibraryDocument) -> LibraryDocument:
        from datetime import date

        self._session.add(
            PjLibraryDocumentRow(
                id=doc.id,
                cnpj=doc.cnpj,
                doc_type=doc.doc_type,
                filename=doc.filename,
                storage_uri=doc.storage_uri,
                retention_until=date.fromisoformat(doc.retention_until),
                legal_hold=doc.legal_hold,
                status=doc.status,
            )
        )
        await self._session.commit()
        return doc

    async def list_by_cnpj(self, cnpj: str) -> list[LibraryDocument]:
        stmt = (
            select(PjLibraryDocumentRow)
            .where(PjLibraryDocumentRow.cnpj == cnpj)
            .order_by(PjLibraryDocumentRow.created_at.desc())
        )
        rows = (await self._session.execute(stmt)).scalars().all()
        return [
            LibraryDocument(
                id=r.id,
                cnpj=r.cnpj.strip(),
                doc_type=r.doc_type,
                filename=r.filename,
                storage_uri=r.storage_uri,
                retention_until=r.retention_until.isoformat(),
                legal_hold=r.legal_hold,
                status=r.status,
            )
            for r in rows
        ]

    async def delete(self, doc_id: uuid.UUID, *, allow_legal_hold: bool = False) -> None:
        row = await self._session.get(PjLibraryDocumentRow, doc_id)
        if row is None:
            raise DomainError(f"Documento {doc_id} não encontrado")
        if row.legal_hold and not allow_legal_hold:
            raise DomainError("legal_hold ativo — DELETE bloqueado (RN002)")
        # expurgo vetores do documento
        await self._session.execute(
            delete(PjRagChunkRow).where(PjRagChunkRow.document_id == doc_id)
        )
        await self._session.delete(row)
        await self._session.commit()


async def ping_database(session: AsyncSession) -> bool:
    try:
        await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
