from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field

from prisma_pj.application.use_case.routing import (
    GetCostTelemetry,
    ListRoutingDecisions,
    ResolveAndRecordRoute,
    UpsertPolicyCommand,
    UpsertRoutingPolicy,
)
from prisma_pj.domain.exception import (
    BudgetExceededError,
    ConflictActivePolicyError,
    ConflictError,
    DomainError,
    NotFoundError,
)
from prisma_pj.presentation.api.deps import (
    get_cost_telemetry,
    get_list_routing_decisions,
    get_resolve_route,
    get_upsert_routing_policy,
)
from prisma_pj.presentation.security.deps import require_roles

router = APIRouter(prefix="/api/v1/pj", tags=["pj-ep03-f09"])


class PolicyRuleIn(BaseModel):
    task_type: str = Field(alias="taskType")
    min_class: str = Field(default="SMALL", alias="minClass")
    max_class: str = Field(default="LARGE", alias="maxClass")

    model_config = {"populate_by_name": True}


class PolicyRequest(BaseModel):
    name: str
    active: bool = True
    rules: list[PolicyRuleIn]
    budget_usd_month: float = Field(default=25000.0, alias="budgetUsdMonth", ge=0)
    hard_stop_pct: float = Field(default=120.0, alias="hardStopPct", ge=100, le=500)

    model_config = {"populate_by_name": True}


class ResolveRouteRequest(BaseModel):
    task_type: str = Field(alias="taskType")
    promote: bool = False
    budget_override: bool = Field(default=False, alias="budgetOverride")
    opinion_id: str | None = Field(default=None, alias="opinionId")

    model_config = {"populate_by_name": True}


def _map_error(exc: DomainError) -> HTTPException:
    if isinstance(exc, BudgetExceededError):
        return HTTPException(status_code=429, detail=str(exc))
    if isinstance(exc, (ConflictActivePolicyError, ConflictError)):
        return HTTPException(status_code=409, detail=str(exc))
    if isinstance(exc, NotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    return HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/routing/policy",
    dependencies=[Depends(require_roles("OPS_AI", "PLATFORM"))],
)
async def upsert_policy(
    body: PolicyRequest,
    response: Response,
    use_case: Annotated[UpsertRoutingPolicy, Depends(get_upsert_routing_policy)],
) -> dict[str, Any]:
    try:
        result = await use_case.execute(
            UpsertPolicyCommand(
                name=body.name,
                active=body.active,
                rules=[
                    {
                        "taskType": r.task_type,
                        "minClass": r.min_class,
                        "maxClass": r.max_class,
                    }
                    for r in body.rules
                ],
                budget_usd_month=body.budget_usd_month,
                hard_stop_pct=body.hard_stop_pct,
            )
        )
    except DomainError as exc:
        raise _map_error(exc) from exc
    response.status_code = 201
    return result


@router.get(
    "/routing/decisions",
    dependencies=[Depends(require_roles("OPS_AI", "ANALISTA_PJ", "PLATFORM"))],
)
async def list_decisions(
    use_case: Annotated[ListRoutingDecisions, Depends(get_list_routing_decisions)],
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    return await use_case.execute(limit=limit, offset=offset)


@router.post(
    "/routing/resolve",
    dependencies=[Depends(require_roles("OPS_AI", "ANALISTA_PJ", "PLATFORM", "GESTOR_AI"))],
)
async def resolve_route_endpoint(
    body: ResolveRouteRequest,
    use_case: Annotated[ResolveAndRecordRoute, Depends(get_resolve_route)],
) -> dict[str, Any]:
    """Resolve + grava decision (lab/API). Promote=true simula guardrail FAIL."""
    import uuid

    opinion_id = uuid.UUID(body.opinion_id) if body.opinion_id else None
    try:
        return await use_case.execute(
            body.task_type,
            promote=body.promote,
            opinion_id=opinion_id,
            budget_override=body.budget_override,
        )
    except DomainError as exc:
        raise _map_error(exc) from exc


@router.get(
    "/telemetry/cost",
    dependencies=[Depends(require_roles("OPS_AI", "FINANCE", "PLATFORM"))],
)
async def telemetry_cost(
    use_case: Annotated[GetCostTelemetry, Depends(get_cost_telemetry)],
    since: Annotated[datetime | None, Query()] = None,
    until: Annotated[datetime | None, Query()] = None,
) -> dict[str, Any]:
    return await use_case.execute(since=since, until=until)
