"""Utilitários de vetor — coluna canônica 1536-d (US F02)."""

from __future__ import annotations

import math


def pad_or_trim(vector: tuple[float, ...] | list[float], target_dims: int) -> list[float]:
    """
    Alinha embedding ao tamanho da coluna pgvector.

    - Menor: zero-pad (só válido entre vetores do MESMO modelo/index_version).
    - Maior: trim (não recomendado; preferir reindex).
    """
    values = [float(v) for v in vector]
    if len(values) == target_dims:
        return values
    if len(values) < target_dims:
        return values + [0.0] * (target_dims - len(values))
    return values[:target_dims]


def l2_normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vector))
    if norm <= 0.0:
        return vector
    return [v / norm for v in vector]
