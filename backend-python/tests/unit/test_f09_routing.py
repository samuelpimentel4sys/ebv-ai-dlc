from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from prisma_pj.application.use_case.routing import (
    ResolveAndRecordRoute,
    UpsertPolicyCommand,
    UpsertRoutingPolicy,
)
from prisma_pj.domain.exception import BudgetExceededError, ConflictActivePolicyError
from prisma_pj.domain.service.routing import (
    estimate_usd,
    hard_stop_reached,
    promote_class,
    resolve_route,
)
from prisma_pj.infrastructure.persistence.model import PjRoutingPolicyRow


def _default_rules() -> list[dict[str, str]]:
    return [
        {"taskType": "SECTION_DRAFT", "minClass": "SMALL", "maxClass": "MEDIUM"},
        {"taskType": "GUARDRAIL_RETRY", "minClass": "MEDIUM", "maxClass": "LARGE"},
    ]


def test_route_section_draft_small() -> None:
    d = resolve_route(_default_rules(), "SECTION_DRAFT", provider="local")
    assert d.model_class == "SMALL"
    assert d.promoted is False
    assert "qwen" in d.model_chosen or d.model_chosen


def test_promote_after_guardrail_fail() -> None:
    d = resolve_route(
        _default_rules(), "SECTION_DRAFT", provider="bedrock", promote=True
    )
    assert d.model_class == "MEDIUM"
    assert d.promoted is True


def test_promote_guardrail_retry_to_large() -> None:
    d = resolve_route(
        _default_rules(), "GUARDRAIL_RETRY", provider="openai", promote=True
    )
    assert d.model_class == "LARGE"
    assert d.promoted is True


def test_promote_class_caps_at_max() -> None:
    assert promote_class("MEDIUM", "MEDIUM") == "MEDIUM"
    assert promote_class("SMALL", "LARGE") == "MEDIUM"


def test_estimate_usd_local_zero() -> None:
    assert estimate_usd("LARGE", 100_000, 50_000, provider="local") == 0.0


def test_estimate_usd_bedrock_positive() -> None:
    usd = estimate_usd("SMALL", 1_000_000, 1_000_000, provider="bedrock")
    assert usd == pytest.approx(0.75)


def test_hard_stop_120() -> None:
    assert hard_stop_reached(1200, 1000, 120) is True
    assert hard_stop_reached(1199, 1000, 120) is False


@pytest.mark.asyncio
async def test_second_active_policy_conflict() -> None:
    repo = MagicMock()
    active = PjRoutingPolicyRow(
        id=uuid4(),
        name="pj-default",
        rules_json={"rules": _default_rules()},
        active=True,
        version=1,
    )
    repo.get_active_policy = AsyncMock(return_value=active)
    repo.find_by_name = AsyncMock(return_value=None)
    use_case = UpsertRoutingPolicy(repo)

    with pytest.raises(ConflictActivePolicyError):
        await use_case.execute(
            UpsertPolicyCommand(
                name="outra-policy",
                active=True,
                rules=_default_rules(),
            )
        )


@pytest.mark.asyncio
async def test_budget_hard_stop_429() -> None:
    repo = MagicMock()
    policy = PjRoutingPolicyRow(
        id=uuid4(),
        name="pj-default",
        rules_json={
            "rules": _default_rules(),
            "budgetUsdMonth": 100.0,
            "hardStopPct": 120.0,
        },
        active=True,
        version=1,
    )
    repo.get_active_policy = AsyncMock(return_value=policy)
    repo.sum_cost_usd = AsyncMock(return_value=150.0)  # 150% of 100
    use_case = ResolveAndRecordRoute(repo, provider="bedrock")

    with pytest.raises(BudgetExceededError):
        await use_case.execute("SECTION_DRAFT", budget_override=False)


@pytest.mark.asyncio
async def test_budget_override_allows() -> None:
    repo = MagicMock()
    policy = PjRoutingPolicyRow(
        id=uuid4(),
        name="pj-default",
        rules_json={
            "rules": _default_rules(),
            "budgetUsdMonth": 100.0,
            "hardStopPct": 120.0,
        },
        active=True,
        version=1,
    )
    saved = MagicMock()
    saved.id = uuid4()
    repo.get_active_policy = AsyncMock(return_value=policy)
    repo.sum_cost_usd = AsyncMock(return_value=150.0)
    repo.save_decision = AsyncMock(return_value=saved)
    use_case = ResolveAndRecordRoute(repo, provider="local")
    result = await use_case.execute(
        "SECTION_DRAFT", budget_override=True
    )
    assert result["modelClass"] == "SMALL"
    assert result["promoted"] is False
