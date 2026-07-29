from prisma_pj.domain.service.guardrail_numbers import (
    extract_numeric_tokens,
    number_grounded_in_source,
)
from prisma_pj.domain.service.ratio_calculator import (
    DEFAULT_RATIO_DEFS,
    RatioDefinition,
    calculate_ratio,
)


def test_margem_liquida_computed() -> None:
    definition = DEFAULT_RATIO_DEFS[0]
    result = calculate_ratio(
        definition,
        {"lucro_liquido": 510_000, "receita_liquida": 10_000_000},
    )
    assert result.status == "COMPUTED"
    assert result.value == 0.051


def test_missing_field_not_computable() -> None:
    definition = RatioDefinition(
        "LIQUIDEZ_CORRENTE",
        "ativo_circulante / passivo_circulante",
        ("ativo_circulante", "passivo_circulante"),
    )
    result = calculate_ratio(definition, {"ativo_circulante": 100})
    assert result.status == "NOT_COMPUTABLE"
    assert "passivo_circulante" in result.missing_fields


def test_number_grounding_ok() -> None:
    claim = "A margem líquida passou para 5,1% em 2025."
    source = "A margem líquida passou de 4,2% em 2023 para 5,1% em 2025."
    assert number_grounded_in_source(claim, source) is True


def test_number_grounding_fail() -> None:
    claim = "A margem líquida chegou a 12,5%."
    source = "A margem líquida passou para 5,1% em 2025."
    assert number_grounded_in_source(claim, source) is False


def test_extract_tokens() -> None:
    tokens = extract_numeric_tokens("crescimento de 4,2% e EBITDA 2,1x")
    assert any("4,2" in t for t in tokens)
