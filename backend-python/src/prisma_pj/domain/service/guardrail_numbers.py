from __future__ import annotations

import re

_NUMBER_RE = re.compile(r"(?<![\w.])(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?%?|(?<![\w.])\d+\.\d+%?")


def extract_numeric_tokens(text: str) -> list[str]:
    """Extrai números/percentuais de claims para RN001 (lastro)."""
    return [m.group(0) for m in _NUMBER_RE.finditer(text)]


def normalize_number_token(token: str) -> str:
    t = token.replace("%", "").strip()
    if "," in t and "." in t:
        # 1.234,56 → 1234.56
        t = t.replace(".", "").replace(",", ".")
    elif "," in t:
        t = t.replace(",", ".")
    return t


def number_grounded_in_source(claim: str, source: str) -> bool:
    """
    RN001: claim numérica exige lastro no trecho citado.
    Sem número na claim → True (claim qualitativa).
    """
    tokens = extract_numeric_tokens(claim)
    if not tokens:
        return True
    source_norm = source.lower()
    source_tokens = {normalize_number_token(t) for t in extract_numeric_tokens(source)}
    for token in tokens:
        raw = token.replace("%", "")
        norm = normalize_number_token(token)
        if raw in source or token in source or norm in source_tokens:
            continue
        # aceita forma percentual textual "5,1%" vs "5.1"
        if norm in source_norm.replace(",", "."):
            continue
        return False
    return True
