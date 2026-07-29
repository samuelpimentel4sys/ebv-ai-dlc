from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from prisma_pj.domain.model.principal import Principal, normalize_role
from prisma_pj.infrastructure.config import Settings, get_settings
from prisma_pj.infrastructure.security.jwt_validator import (
    JwtValidationError,
    validate_access_token,
)

# Roles EP-03 GenAI (US F01-F07) + PLATFORM admin
PJ_ANALISTA_ROLES = ("ANALISTA_PJ", "PLATFORM")
PJ_READ_ROLES = (
    "ANALISTA_PJ",
    "APROVADOR_PJ_L1",
    "APROVADOR_PJ_L2",
    "APROVADOR_PJ_L3",
    "AUDIT",
    "PLATFORM",
)


def _lab_principal() -> Principal:
    return Principal(
        sub="lab-anonymous",
        roles=frozenset({normalize_role("PLATFORM")}),
        lab_bypass=True,
    )


def _bearer_token(request: Request) -> str | None:
    header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not header:
        return None
    parts = header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        return None
    return parts[1].strip()


async def get_principal(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> Principal:
    """
    Espelho Noah: `OIDC_ENABLED=false` -> lab aberto.
    Com OIDC on -> Bearer JWT obrigatorio (401 sem token / invalido).
    """
    if not settings.oidc_enabled:
        return _lab_principal()

    token = _bearer_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token obrigatorio",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return validate_access_token(token, settings)
    except JwtValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT invalido: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def require_roles(*roles: str) -> Callable[..., Awaitable[Principal]]:
    """Dependency factory: exige qualquer role da lista (ou lab bypass)."""

    async def _dep(principal: Annotated[Principal, Depends(get_principal)]) -> Principal:
        if principal.has_any_role(*roles):
            return principal
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requer uma das roles: {', '.join(normalize_role(r) for r in roles)}",
        )

    return _dep


RequireAnalistaPj = Annotated[Principal, Depends(require_roles(*PJ_ANALISTA_ROLES))]
RequirePjRead = Annotated[Principal, Depends(require_roles(*PJ_READ_ROLES))]
