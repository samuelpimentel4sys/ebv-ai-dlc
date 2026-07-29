from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RatioDefinition:
    code: str
    formula_expr: str
    required_fields: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class RatioResult:
    code: str
    status: str  # COMPUTED | NOT_COMPUTABLE
    formula_snapshot: str
    value: float | None = None
    missing_fields: tuple[str, ...] = ()
    inputs: dict[str, float] | None = None


def calculate_ratio(definition: RatioDefinition, fields: dict[str, float]) -> RatioResult:
    missing = tuple(f for f in definition.required_fields if f not in fields)
    if missing:
        return RatioResult(
            code=definition.code,
            status="NOT_COMPUTABLE",
            formula_snapshot=definition.formula_expr,
            missing_fields=missing,
            inputs={},
        )
    inputs = {f: float(fields[f]) for f in definition.required_fields}
    # formulas explícitas (sem eval) — catálogo canônico P2
    value: float
    if definition.code == "MARGEM_LIQUIDA":
        denom = inputs["receita_liquida"]
        value = inputs["lucro_liquido"] / denom if denom else float("nan")
    elif definition.code == "LIQUIDEZ_CORRENTE":
        denom = inputs["passivo_circulante"]
        value = inputs["ativo_circulante"] / denom if denom else float("nan")
    elif definition.code == "ALAVANCAGEM":
        denom = inputs["ebitda"]
        value = inputs["divida_liquida"] / denom if denom else float("nan")
    elif definition.code == "ROE":
        denom = inputs["patrimonio_liquido"]
        value = inputs["lucro_liquido"] / denom if denom else float("nan")
    else:
        return RatioResult(
            code=definition.code,
            status="NOT_COMPUTABLE",
            formula_snapshot=definition.formula_expr,
            missing_fields=("unsupported_formula",),
            inputs=inputs,
        )
    if value != value:  # NaN
        return RatioResult(
            code=definition.code,
            status="NOT_COMPUTABLE",
            formula_snapshot=definition.formula_expr,
            missing_fields=("division_by_zero",),
            inputs=inputs,
        )
    return RatioResult(
        code=definition.code,
        status="COMPUTED",
        formula_snapshot=definition.formula_expr,
        value=round(value, 6),
        inputs=inputs,
    )


DEFAULT_RATIO_DEFS: tuple[RatioDefinition, ...] = (
    RatioDefinition(
        "MARGEM_LIQUIDA", "lucro_liquido / receita_liquida", ("lucro_liquido", "receita_liquida")
    ),
    RatioDefinition(
        "LIQUIDEZ_CORRENTE",
        "ativo_circulante / passivo_circulante",
        ("ativo_circulante", "passivo_circulante"),
    ),
    RatioDefinition("ALAVANCAGEM", "divida_liquida / ebitda", ("divida_liquida", "ebitda")),
    RatioDefinition(
        "ROE", "lucro_liquido / patrimonio_liquido", ("lucro_liquido", "patrimonio_liquido")
    ),
)
