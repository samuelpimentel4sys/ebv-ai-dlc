from __future__ import annotations

import json
from pathlib import Path

from prisma_pj.application.use_case.extraction import _resolve_fields, load_fixture_payload

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "fixtures" / "f01"


def test_fixtures_exist() -> None:
    assert (FIXTURES / "companies.json").exists()
    assert (FIXTURES / "alpha_2025.json").exists()
    assert (FIXTURES / "docs" / "balanco_alpha_2025.txt").exists()


def test_alpha_has_ratio_fields() -> None:
    data = load_fixture_payload("alpha_2025.json")
    keys = {f["fieldKey"] for f in data["fields"]}
    required = {
        "lucro_liquido",
        "receita_liquida",
        "ativo_circulante",
        "passivo_circulante",
        "divida_liquida",
        "ebitda",
        "patrimonio_liquido",
    }
    assert required <= keys


def test_pending_review_fields_present() -> None:
    companies = json.loads((FIXTURES / "companies.json").read_text(encoding="utf-8"))
    threshold = float(companies["threshold"])
    low = []
    for path in FIXTURES.glob("*.json"):
        if path.name in {"companies.json", "SEED_RESULT.json"}:
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            continue
        for f in data["fields"]:
            if float(f["confidence"]) < threshold:
                low.append(f["fieldKey"])
    assert "despesa_financeira" in low or "estoque" in low or "contas_a_receber" in low


def test_resolve_fields_matches_cnpj() -> None:
    fields = _resolve_fields("12345678000199", 2025, "balanco_alpha_2025.txt")
    assert any(f["fieldKey"] == "lucro_liquido" and f["valueNum"] == 510000.0 for f in fields)


def test_resolve_fields_fallback() -> None:
    fields = _resolve_fields("00000000000191", 2099, "x.txt")
    assert len(fields) >= 7
