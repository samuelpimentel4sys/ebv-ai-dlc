from __future__ import annotations

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field

from prisma_pj.application.use_case.copilot import (
    CalculateRatios,
    CalculateRatiosCommand,
    CreateOpinionCommand,
    GenerateOpinion,
    GetGuardrailReport,
    GetOpinion,
    ListRatioBenchmarks,
    ListRatiosByCnpj,
    PatchOpinion,
    VerifyGuardrailCommand,
    VerifyOpinionGuardrails,
)
from prisma_pj.domain.exception import (
    ConflictError,
    DomainError,
    NotFoundError,
    ValidationRejectedError,
)
from prisma_pj.presentation.api.deps import (
    get_calculate_ratios,
    get_generate_opinion,
    get_get_opinion,
    get_guardrail_report,
    get_list_benchmarks,
    get_list_ratios,
    get_patch_opinion,
    get_verify_guardrails,
)
from prisma_pj.presentation.security.deps import require_roles

router = APIRouter(
    prefix="/api/v1/pj",
    tags=["pj-ep03-p2"],
    dependencies=[Depends(require_roles("ANALISTA_PJ", "PLATFORM"))],
)


class CalculateRequest(BaseModel):
    cnpj: str
    fiscal_year: int = Field(alias="fiscalYear")
    chart_version: str = Field(default="CANON-2026.1", alias="chartVersion")
    fields: dict[str, float] = Field(default_factory=dict)
    force_estimate: bool = Field(default=False, alias="forceEstimate")
    cnae: str | None = None

    model_config = {"populate_by_name": True}


class OpinionCreateRequest(BaseModel):
    cnpj: str
    operation_amount: float | None = Field(default=None, alias="operationAmount")
    currency: str = "BRL"
    sections: list[str] = Field(
        default_factory=lambda: ["RESUMO", "INDICES", "RISCOS", "RECOMENDACAO"]
    )
    sync: bool = True

    model_config = {"populate_by_name": True}


class SectionPatch(BaseModel):
    code: str
    content_md: str = Field(alias="contentMd")

    model_config = {"populate_by_name": True}


class OpinionPatchRequest(BaseModel):
    sections: list[SectionPatch]


class VerifyRequest(BaseModel):
    opinion_id: uuid.UUID = Field(alias="opinionId")

    model_config = {"populate_by_name": True}


def _map_error(exc: DomainError) -> HTTPException:
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ConflictError):
        return HTTPException(status_code=409, detail=str(exc))
    if isinstance(exc, ValidationRejectedError):
        return HTTPException(status_code=422, detail=str(exc))
    return HTTPException(status_code=400, detail=str(exc))


@router.post("/ratios/calculate")
async def ratios_calculate(
    body: CalculateRequest,
    use_case: Annotated[CalculateRatios, Depends(get_calculate_ratios)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            CalculateRatiosCommand(
                cnpj=body.cnpj,
                fiscal_year=body.fiscal_year,
                chart_version=body.chart_version,
                fields=body.fields,
                force_estimate=body.force_estimate,
                cnae=body.cnae,
            )
        )
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.get("/ratios/benchmarks")
async def ratios_benchmarks(
    use_case: Annotated[ListRatioBenchmarks, Depends(get_list_benchmarks)],
    cnae: str = Query(..., description="CNAE para mediana setorial"),
) -> dict[str, Any]:
    items = await use_case.execute(cnae)
    return {"cnae": cnae, "benchmarks": items}


@router.get("/{cnpj}/ratios")
async def ratios_by_cnpj(
    cnpj: str,
    use_case: Annotated[ListRatiosByCnpj, Depends(get_list_ratios)],
) -> dict[str, Any]:
    try:
        runs = await use_case.execute(cnpj)
    except DomainError as exc:
        raise _map_error(exc) from exc
    return {"cnpj": cnpj, "runs": runs}


@router.post("/opinions")
async def opinions_create(
    body: OpinionCreateRequest,
    response: Response,
    use_case: Annotated[GenerateOpinion, Depends(get_generate_opinion)],
) -> dict[str, Any]:
    try:
        result = await use_case.execute(
            CreateOpinionCommand(
                cnpj=body.cnpj,
                sections=body.sections,
                operation_amount=body.operation_amount,
                currency=body.currency,
                sync=body.sync,
            )
        )
    except DomainError as exc:
        raise _map_error(exc) from exc
    if result.get("partial"):
        response.status_code = 206
    elif result.get("status") == "GENERATING":
        response.status_code = 202
    return result


@router.get("/opinions/{opinion_id}")
async def opinions_get(
    opinion_id: uuid.UUID,
    use_case: Annotated[GetOpinion, Depends(get_get_opinion)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(opinion_id)
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.patch("/opinions/{opinion_id}")
async def opinions_patch(
    opinion_id: uuid.UUID,
    body: OpinionPatchRequest,
    use_case: Annotated[PatchOpinion, Depends(get_patch_opinion)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(
            opinion_id,
            [{"code": s.code, "contentMd": s.content_md} for s in body.sections],
        )
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.post("/guardrails/verify")
async def guardrails_verify(
    body: VerifyRequest,
    response: Response,
    use_case: Annotated[VerifyOpinionGuardrails, Depends(get_verify_guardrails)],
) -> dict[str, Any]:
    try:
        result = await use_case.execute(VerifyGuardrailCommand(opinion_id=body.opinion_id))
    except DomainError as exc:
        raise _map_error(exc) from exc
    if result.get("status") == "FAILED":
        response.status_code = 422
    return result


@router.get("/guardrails/report/{opinion_id}")
async def guardrails_report(
    opinion_id: uuid.UUID,
    use_case: Annotated[GetGuardrailReport, Depends(get_guardrail_report)],
) -> dict[str, Any]:
    try:
        return await use_case.execute(opinion_id)
    except DomainError as exc:
        raise _map_error(exc) from exc
