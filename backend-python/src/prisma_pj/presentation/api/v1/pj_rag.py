from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from prisma_pj.application.use_case.rag import (
    CreateLibraryCommand,
    CreateLibraryDocument,
    DeleteLibraryDocument,
    GetRagCitations,
    IndexChunkPayload,
    IndexRagCommand,
    IndexRagDocument,
    ListLibraryByCnpj,
    QueryRag,
    QueryRagCommand,
)
from prisma_pj.domain.exception import DomainError
from prisma_pj.presentation.api.deps import (
    get_create_library,
    get_delete_library,
    get_index_rag,
    get_list_library,
    get_query_rag,
    get_rag_citations,
)
from prisma_pj.presentation.security.deps import require_roles

router = APIRouter(
    prefix="/api/v1/pj",
    tags=["pj-ep03"],
    dependencies=[Depends(require_roles("ANALISTA_PJ", "PLATFORM"))],
)


class ChunkIn(BaseModel):
    page: int = Field(ge=0)
    start: int = Field(ge=0, alias="start")
    end: int = Field(ge=0)
    content: str = Field(min_length=1)

    model_config = {"populate_by_name": True}


class IndexRequest(BaseModel):
    cnpj: str
    document_id: uuid.UUID
    chunks: list[ChunkIn]


class QueryRequest(BaseModel):
    cnpj: str
    query: str
    top_k: int = Field(default=8, ge=1, le=32, alias="topK")

    model_config = {"populate_by_name": True}


class LibraryCreateRequest(BaseModel):
    cnpj: str
    doc_type: str = Field(alias="docType")
    filename: str
    storage_uri: str = Field(alias="storageUri")
    retention_until: str = Field(alias="retentionUntil")

    model_config = {"populate_by_name": True}


def _http_domain(exc: DomainError) -> HTTPException:
    msg = str(exc)
    status = 400
    if "legal_hold" in msg:
        status = 409
    if "não encontrado" in msg:
        status = 404
    if "docType" in msg:
        status = 422
    return HTTPException(status_code=status, detail=msg)


@router.post("/rag/index")
async def rag_index(
    body: IndexRequest,
    use_case: Annotated[IndexRagDocument, Depends(get_index_rag)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            IndexRagCommand(
                cnpj=body.cnpj,
                document_id=body.document_id,
                chunks=[
                    IndexChunkPayload(page=c.page, start=c.start, end=c.end, content=c.content)
                    for c in body.chunks
                ],
            )
        )
    except DomainError as exc:
        raise _http_domain(exc) from exc


@router.post("/rag/query")
async def rag_query(
    body: QueryRequest,
    use_case: Annotated[QueryRag, Depends(get_query_rag)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            QueryRagCommand(cnpj=body.cnpj, query=body.query, top_k=body.top_k)
        )
    except DomainError as exc:
        raise _http_domain(exc) from exc


@router.get("/rag/citations/{answer_id}")
async def rag_citations(
    answer_id: uuid.UUID,
    use_case: Annotated[GetRagCitations, Depends(get_rag_citations)],
) -> dict[str, Any]:
    hits = await use_case.execute(answer_id)
    return {
        "answerId": str(answer_id),
        "citations": [
            {
                "chunkId": str(h.chunk_id),
                "documentId": str(h.document_id),
                "page": h.page,
                "start": h.start_offset,
                "end": h.end_offset,
                "score": float(h.score),
                "excerpt": h.content,
            }
            for h in hits
        ],
    }


@router.post("/library/documents")
async def library_create(
    body: LibraryCreateRequest,
    use_case: Annotated[CreateLibraryDocument, Depends(get_create_library)],
) -> dict[str, Any]:
    try:
        doc = await use_case.execute(
            CreateLibraryCommand(
                cnpj=body.cnpj,
                doc_type=body.doc_type,
                filename=body.filename,
                storage_uri=body.storage_uri,
                retention_until=body.retention_until,
            )
        )
    except DomainError as exc:
        raise _http_domain(exc) from exc
    return {
        "id": str(doc.id),
        "cnpj": doc.cnpj,
        "docType": doc.doc_type,
        "filename": doc.filename,
        "storageUri": doc.storage_uri,
        "retentionUntil": doc.retention_until,
        "status": doc.status,
    }


@router.get("/library/{cnpj}")
async def library_list(
    cnpj: str,
    use_case: Annotated[ListLibraryByCnpj, Depends(get_list_library)],
) -> dict[str, Any]:
    try:
        docs = await use_case.execute(cnpj)
    except DomainError as exc:
        raise _http_domain(exc) from exc
    return {
        "cnpj": cnpj,
        "documents": [
            {
                "id": str(d.id),
                "docType": d.doc_type,
                "filename": d.filename,
                "storageUri": d.storage_uri,
                "retentionUntil": d.retention_until,
                "legalHold": d.legal_hold,
                "status": d.status,
            }
            for d in docs
        ],
    }


@router.delete("/library/documents/{doc_id}")
async def library_delete(
    doc_id: uuid.UUID,
    use_case: Annotated[DeleteLibraryDocument, Depends(get_delete_library)],
) -> dict[str, str]:
    try:
        await use_case.execute(doc_id)
    except DomainError as exc:
        raise _http_domain(exc) from exc
    return {"status": "deleted", "id": str(doc_id)}
