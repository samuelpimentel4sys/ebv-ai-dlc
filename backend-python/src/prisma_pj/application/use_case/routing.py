from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from prisma_pj.domain.exception import (
    BudgetExceededError,
    ConflictActivePolicyError,
    DomainError,
    NotFoundError,
)
from prisma_pj.domain.service.routing import (
    estimate_usd,
    hard_stop_reached,
    parse_class,
    resolve_route,
)
from prisma_pj.infrastructure.persistence.routing_repository import SqlAlchemyRoutingRepository


@dataclass(frozen=True, slots=True)
class UpsertPolicyCommand:
    name: str
    active: bool
    rules: list[dict[str, Any]]
    budget_usd_month: float = 25000.0
    hard_stop_pct: float = 120.0


class UpsertRoutingPolicy:
    def __init__(self, repo: SqlAlchemyRoutingRepository) -> None:
        self._repo = repo

    async def execute(self, command: UpsertPolicyCommand) -> dict[str, Any]:
        name = command.name.strip()
        if not name:
            raise DomainError("name obrigatorio")
        if not command.rules:
            raise DomainError("rules obrigatorio")
        for rule in command.rules:
            if "taskType" not in rule:
                raise DomainError("rule.taskType obrigatorio")
            parse_class(str(rule.get("minClass", "SMALL")))
            parse_class(str(rule.get("maxClass", "LARGE")))

        existing_active = await self._repo.get_active_policy()
        existing_same = await self._repo.find_by_name(name)

        if command.active and existing_active is not None and existing_active.name != name:
            raise ConflictActivePolicyError(
                "Ja existe policy ACTIVE; desative a atual antes"
            )

        version = 1
        if existing_same is not None:
            version = int(existing_same.version) + 1

        payload = {
            "rules": command.rules,
            "budgetUsdMonth": command.budget_usd_month,
            "hardStopPct": command.hard_stop_pct,
        }
        row = await self._repo.save_policy(
            name=name,
            rules_json=payload,
            active=command.active,
            version=version,
        )
        if command.active:
            await self._repo.deactivate_all_except(row.id)

        return {
            "policyId": str(row.id),
            "version": row.version,
            "active": row.active,
            "name": row.name,
        }

class GetCostTelemetry:
    def __init__(self, repo: SqlAlchemyRoutingRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        *,
        since: datetime | None = None,
        until: datetime | None = None,
    ) -> dict[str, Any]:
        until = until or datetime.now(UTC)
        if since is None:
            since = until.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if since.tzinfo is None:
            since = since.replace(tzinfo=UTC)
        if until.tzinfo is None:
            until = until.replace(tzinfo=UTC)

        total = await self._repo.sum_cost_usd(since=since, until=until)
        breakdown = await self._repo.cost_breakdown(since=since, until=until)
        policy = await self._repo.get_active_policy()
        budget = None
        hard_stop = 120.0
        if policy is not None:
            budget = float((policy.rules_json or {}).get("budgetUsdMonth") or 0)
            hard_stop = float((policy.rules_json or {}).get("hardStopPct") or 120)
        pct = (total / budget * 100.0) if budget else None
        return {
            "from": since.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "to": until.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "totalUsd": round(total, 6),
            "budgetUsdMonth": budget,
            "hardStopPct": hard_stop,
            "budgetUsedPct": round(pct, 2) if pct is not None else None,
            "hardStopReached": bool(
                budget and hard_stop_reached(total, budget, hard_stop)
            ),
            "byModel": breakdown,
        }


class ListRoutingDecisions:
    def __init__(self, repo: SqlAlchemyRoutingRepository) -> None:
        self._repo = repo

    async def execute(self, *, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        limit = max(1, min(limit, 200))
        offset = max(0, offset)
        rows = await self._repo.list_decisions(limit=limit, offset=offset)
        return {
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "id": str(r.id),
                    "taskType": r.task_type,
                    "modelChosen": r.model_chosen,
                    "modelClass": r.model_class,
                    "reason": r.reason,
                    "promoted": r.promoted,
                    "opinionId": str(r.opinion_id) if r.opinion_id else None,
                    "at": r.at.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
                    if r.at.tzinfo
                    else r.at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                }
                for r in rows
            ],
        }


class ResolveAndRecordRoute:
    """Resolve rota + grava decision; checa hard-stop (CA-06)."""

    def __init__(
        self,
        repo: SqlAlchemyRoutingRepository,
        *,
        provider: str = "local",
    ) -> None:
        self._repo = repo
        self._provider = provider

    async def execute(
        self,
        task_type: str,
        *,
        promote: bool = False,
        opinion_id: uuid.UUID | None = None,
        budget_override: bool = False,
    ) -> dict[str, Any]:
        policy = await self._repo.get_active_policy()
        if policy is None:
            raise NotFoundError("Nenhuma policy ACTIVE")

        rules_doc = policy.rules_json or {}
        rules = list(rules_doc.get("rules") or [])
        budget = float(rules_doc.get("budgetUsdMonth") or 0)
        hard_stop = float(rules_doc.get("hardStopPct") or 120)

        now = datetime.now(UTC)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        spent = await self._repo.sum_cost_usd(since=month_start, until=now)
        if (
            budget > 0
            and hard_stop_reached(spent, budget, hard_stop)
            and not budget_override
        ):
            raise BudgetExceededError(
                f"Hard-stop {hard_stop}% do budget USD {budget} atingido "
                f"(gasto={spent:.4f}); requer override GESTOR_AI"
            )

        decision = resolve_route(
            rules, task_type, provider=self._provider, promote=promote
        )
        row = await self._repo.save_decision(decision, opinion_id=opinion_id)
        return {
            "decisionId": str(row.id),
            "taskType": decision.task_type,
            "modelClass": decision.model_class,
            "modelChosen": decision.model_chosen,
            "reason": decision.reason,
            "promoted": decision.promoted,
            "spentUsdMonth": spent,
            "budgetUsdMonth": budget,
        }


class RecordInferenceCost:
    def __init__(
        self,
        repo: SqlAlchemyRoutingRepository,
        *,
        provider: str = "local",
    ) -> None:
        self._repo = repo
        self._provider = provider

    async def execute(
        self,
        *,
        model: str,
        model_class: str,
        input_tokens: int,
        output_tokens: int,
        task_type: str | None = None,
    ) -> dict[str, Any]:
        from prisma_pj.domain.service.routing import ModelClass

        cls: ModelClass = parse_class(model_class)
        usd = estimate_usd(
            cls,
            max(0, input_tokens),
            max(0, output_tokens),
            provider=self._provider,
        )
        row = await self._repo.save_cost(
            model=model,
            input_tokens=max(0, input_tokens),
            output_tokens=max(0, output_tokens),
            usd=usd,
            task_type=task_type,
            provider=self._provider,
        )
        return {"costId": str(row.id), "usd": float(row.usd), "model": row.model}
