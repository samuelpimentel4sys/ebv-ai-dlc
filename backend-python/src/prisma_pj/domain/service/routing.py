from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

ModelClass = Literal["SMALL", "MEDIUM", "LARGE"]

_CLASS_ORDER: tuple[ModelClass, ...] = ("SMALL", "MEDIUM", "LARGE")

# USD per 1M tokens (lab defaults — ajuste D4 Bedrock)
_PRICE_PER_M: dict[ModelClass, tuple[float, float]] = {
    "SMALL": (0.15, 0.60),
    "MEDIUM": (1.00, 3.00),
    "LARGE": (3.00, 15.00),
}

_CLASS_MODELS: dict[ModelClass, dict[str, str]] = {
    "SMALL": {
        "local": "qwen2.5:7b",
        "bedrock": "anthropic.claude-3-haiku-20240307-v1:0",
        "openai": "gpt-4o-mini",
        "gemini": "gemini-2.5-flash",
    },
    "MEDIUM": {
        "local": "qwen2.5:14b",
        "bedrock": "anthropic.claude-3-sonnet-20240229-v1:0",
        "openai": "gpt-4o",
        "gemini": "gemini-2.5-pro",
    },
    "LARGE": {
        "local": "qwen2.5:32b",
        "bedrock": "anthropic.claude-3-opus-20240229-v1:0",
        "openai": "gpt-4o",
        "gemini": "gemini-2.5-pro",
    },
}


@dataclass(frozen=True, slots=True)
class RouteDecision:
    task_type: str
    model_class: ModelClass
    model_chosen: str
    reason: str
    promoted: bool


def parse_class(value: str) -> ModelClass:
    upper = value.strip().upper()
    if upper == "SMALL":
        return "SMALL"
    if upper == "MEDIUM":
        return "MEDIUM"
    if upper == "LARGE":
        return "LARGE"
    raise ValueError(f"Classe invalida: {value}")


def class_index(value: ModelClass) -> int:
    return _CLASS_ORDER.index(value)


def promote_class(current: ModelClass, max_class: ModelClass) -> ModelClass:
    nxt = min(class_index(current) + 1, class_index(max_class))
    return _CLASS_ORDER[nxt]


def estimate_usd(
    model_class: ModelClass,
    input_tokens: int,
    output_tokens: int,
    *,
    provider: str = "bedrock",
) -> float:
    """Custo estimado. Provider local = ~0."""
    if provider == "local":
        return 0.0
    pin, pout = _PRICE_PER_M[model_class]
    return (input_tokens / 1_000_000.0) * pin + (output_tokens / 1_000_000.0) * pout


def resolve_route(
    rules: list[dict[str, Any]],
    task_type: str,
    *,
    provider: str = "local",
    promote: bool = False,
) -> RouteDecision:
    """
    RN001: menor classe que atenda (minClass).
    Promote apos guardrail FAIL sobe 1 classe ate maxClass.
    """
    rule = next((r for r in rules if str(r.get("taskType")) == task_type), None)
    if rule is None:
        # default conservador
        min_c: ModelClass = "SMALL"
        max_c: ModelClass = "MEDIUM"
        reason = f"Sem rule para {task_type}; default SMALL"
    else:
        min_c = parse_class(str(rule.get("minClass", "SMALL")))
        max_c = parse_class(str(rule.get("maxClass", "LARGE")))
        if class_index(min_c) > class_index(max_c):
            min_c, max_c = max_c, min_c
        reason = f"Policy min={min_c} max={max_c}"

    chosen = min_c
    promoted = False
    if promote and class_index(chosen) < class_index(max_c):
        chosen = promote_class(chosen, max_c)
        promoted = True
        reason = f"{reason}; promote apos guardrail FAIL -> {chosen}"

    models = _CLASS_MODELS[chosen]
    model_name = models.get(provider) or models["local"]
    return RouteDecision(
        task_type=task_type,
        model_class=chosen,
        model_chosen=model_name,
        reason=reason,
        promoted=promoted,
    )


def hard_stop_reached(
    spent_usd: float,
    budget_usd_month: float,
    hard_stop_pct: float = 120.0,
) -> bool:
    if budget_usd_month <= 0:
        return False
    return spent_usd >= budget_usd_month * (hard_stop_pct / 100.0)
