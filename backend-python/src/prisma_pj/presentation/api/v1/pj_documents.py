from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from prisma_pj.application.use_case.extraction import (
    CorrectExtractionField,
    GetExtraction,
    UploadAndExtractDocument,
    UploadDocumentCommand,
)
from prisma_pj.domain.exception import DomainError, NotFoundError
from prisma_pj.presentation.api.deps import (
    get_correct_extraction,
    get_upload_extract,
)
from prisma_pj.presentation.api.deps import (
    get_extraction as get_extraction_uc,
)
from prisma_pj.presentation.security.deps import require_roles

router = APIRouter(
    prefix="/api/v1/pj",
    tags=["pj-ep03-f01"],
    dependencies=[Depends(require_roles("ANALISTA_PJ", "PLATFORM", "SUPERVISOR_PJ"))],
)


class CorrectRequest(BaseModel):
    field_key: str = Field(alias="fieldKey")
    corrected_value_num: float = Field(alias="correctedValueNum")
    cnpj: str | None = None

    model_config = {"populate_by_name": True}


def _map_error(exc: DomainError) -> HTTPException:
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if "Cross-CNPJ" in str(exc):
        return HTTPException(status_code=403, detail=str(exc))
    if "14 digitos" in str(exc):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=400, detail=str(exc))


@router.post("/documents")
async def upload_document(
    use_case: Annotated[UploadAndExtractDocument, Depends(get_upload_extract)],
    cnpj: Annotated[str, Form()],
    fiscal_year: Annotated[int, Form(alias="fiscalYear")],
    file: Annotated[UploadFile, File()],
) -> dict[str, Any]:
    content = await file.read()
    try:
        return await use_case.execute(
            UploadDocumentCommand(
                cnpj=cnpj,
                fiscal_year=fiscal_year,
                filename=file.filename or "upload.bin",
                content=content,
                mime_type=file.content_type or "application/octet-stream",
                sync_extract=True,
            )
        )
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.get("/documents/{doc_id}/extraction")
async def documents_extraction(
    doc_id: uuid.UUID,
    use_case: Annotated[GetExtraction, Depends(get_extraction_uc)],
    cnpj: str | None = None,
) -> dict[str, Any]:
    try:
        return await use_case.execute(doc_id, cnpj=cnpj)
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.patch("/documents/{doc_id}/correct")
async def correct_field(
    doc_id: uuid.UUID,
    body: CorrectRequest,
    use_case: Annotated[CorrectExtractionField, Depends(get_correct_extraction)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            doc_id,
            field_key=body.field_key,
            corrected_value_num=body.corrected_value_num,
            cnpj=body.cnpj,
        )
    except DomainError as exc:
        raise _map_error(exc) from exc
