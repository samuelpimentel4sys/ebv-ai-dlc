from __future__ import annotations

from dataclasses import dataclass, field


def normalize_role(role: str) -> str:
    """Espelho KeycloakRealmRoleConverter (Noah): garante prefixo ROLE_."""
    r = role.strip()
    if not r:
        return r
    return r if r.startswith("ROLE_") else f"ROLE_{r}"


def extract_realm_roles(claims: dict[str, object]) -> frozenset[str]:
    """Lê `realm_access.roles` do access token Keycloak."""
    realm = claims.get("realm_access")
    if not isinstance(realm, dict):
        return frozenset()
    raw = realm.get("roles")
    if not isinstance(raw, (list, tuple, set)):
        return frozenset()
    return frozenset(normalize_role(str(r)) for r in raw if str(r).strip())


@dataclass(frozen=True, slots=True)
class Principal:
    """Identidade autenticada (ou lab anônimo quando OIDC off)."""

    sub: str
    roles: frozenset[str] = field(default_factory=frozenset)
    client_id: str | None = None
    lab_bypass: bool = False

    def has_any_role(self, *required: str) -> bool:
        if self.lab_bypass:
            return True
        needed = {normalize_role(r) for r in required}
        return bool(self.roles & needed)
