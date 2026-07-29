from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field

from prisma_pj.application.use_case.group import GetGroupExposure, GetRelatedParties, RefreshGroup
from prisma_pj.domain.exception import DomainError
from prisma_pj.presentation.api.deps import (
    get_group_exposure,
    get_refresh_group,
    get_related_parties,
)
from prisma_pj.presentation.security.deps import require_roles

router = APIRouter(
    prefix="/api/v1/pj",
    tags=["pj-ep03-f08"],
    dependencies=[Depends(require_roles("ANALISTA_PJ", "PLATFORM", "RISCO_PJ"))],
)


class RefreshRequest(BaseModel):
    cnpj: str
    depth: int = Field(default=3, ge=1, le=3)


def _map_error(exc: DomainError) -> HTTPException:
    msg = str(exc)
    if "timeout" in msg.lower():
        return HTTPException(status_code=503, detail=msg)
    if "14 digitos" in msg or "14 dígitos" in msg:
        return HTTPException(status_code=400, detail=msg)
    if "inexistente" in msg:
        return HTTPException(status_code=404, detail=msg)
    return HTTPException(status_code=400, detail=msg)


@router.post("/group/refresh")
async def group_refresh(
    body: RefreshRequest,
    response: Response,
    use_case: Annotated[RefreshGroup, Depends(get_refresh_group)],
) -> dict[str, Any]:
    try:
        result = await use_case.execute(body.cnpj, depth=body.depth)
    except DomainError as exc:
        raise _map_error(exc) from exc
    response.status_code = 202
    return result


@router.get("/{cnpj}/group")
async def group_get(
    cnpj: str,
    use_case: Annotated[GetGroupExposure, Depends(get_group_exposure)],
    depth: int = Query(default=3, ge=1, le=3),
) -> dict[str, Any]:
    try:
        return await use_case.execute(cnpj, depth=depth)
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.get("/{cnpj}/related-parties")
async def related_parties(
    cnpj: str,
    use_case: Annotated[GetRelatedParties, Depends(get_related_parties)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(cnpj)
    except DomainError as exc:
        raise _map_error(exc) from exc
