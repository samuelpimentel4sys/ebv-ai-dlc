class DomainError(Exception):
    """Base de erros de domínio EP-03."""


class NotFoundError(DomainError):
    """Recurso inexistente."""


class ConflictError(DomainError):
    """Conflito de estado / versão."""


class ValidationRejectedError(DomainError):
    """Regra de negócio rejeitou (ex.: forceEstimate)."""


class LlmProviderError(DomainError):
    """Falha ao invocar o provider de LLM."""


class EmbeddingProviderError(DomainError):
    """Falha ao gerar embeddings."""


class ProviderNotConfiguredError(DomainError):
    """Provider selecionado sem credenciais / URL."""


class BudgetExceededError(DomainError):
    """Teto de gasto GenAI (hard-stop) — HTTP 429."""


class ConflictActivePolicyError(ConflictError):
    """Ja existe policy ACTIVE — HTTP 409."""
