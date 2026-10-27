"""LLM stub — showcase sem Ollama/cloud."""

from __future__ import annotations

import re
import time

from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmResult
from prisma_pj.infrastructure.config import Settings

_SECTION_RE = re.compile(
    r"se[cç][aã]o\s+(RESUMO|INDICES|RISCOS|RECOMENDACAO)\b",
    re.IGNORECASE,
)

_CANNED: dict[str, str] = {
    "RESUMO": (
        "## RESUMO (SHOWCASE)\n\n"
        "Parecer sintético para demonstração. Empresa com perfil PJ de laboratório; "
        "números e trechos vêm do Supabase/fixtures — **sem chamada a LLM real**.\n\n"
        "Use este modo para pitch de fluxo (upload → RAG → parecer → HITL)."
    ),
    "INDICES": (
        "## ÍNDICES (SHOWCASE)\n\n"
        "Índices calculados no domínio (liquidez, endividamento, margem) quando houver "
        "extração F01. Neste stub não inventamos percentuais — consulte `tb_pj_ratio`."
    ),
    "RISCOS": (
        "## RISCOS (SHOWCASE)\n\n"
        "Riscos demonstrativos: concentração de receita, atraso documental e "
        "dependência de stub Neptune (F08). Marcar UNVERIFIED se RAG sem citação."
    ),
    "RECOMENDACAO": (
        "## RECOMENDAÇÃO (SHOWCASE)\n\n"
        "Recomendação de laboratório: **seguir para revisão humana (HITL Noah)** "
        "com alçada conforme política. Não usar como decisão de crédito real."
    ),
}


class StubLlmAdapter:
    """Respostas determinísticas — provider `stub` / SHOWCASE_MODE."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def provider_name(self) -> str:
        return "stub"

    @property
    def model_name(self) -> str:
        return "showcase-stub-v1"

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> LlmResult:
        del temperature, max_tokens
        started = time.perf_counter()
        user_blob = "\n".join(m.content for m in messages if m.role == "user")
        match = _SECTION_RE.search(user_blob)
        section = match.group(1).upper() if match else ""
        if section in _CANNED:
            content = _CANNED[section]
        elif user_blob.strip():
            snippet = user_blob.strip().replace("\n", " ")[:120]
            content = (
                f"[SHOWCASE stub] Eco determinístico: {snippet}"
                + ("…" if len(user_blob.strip()) > 120 else "")
            )
        else:
            content = "[SHOWCASE stub] ok"
        latency_ms = int((time.perf_counter() - started) * 1000)
        return LlmResult(
            content=content,
            provider=self.provider_name,
            model=self.model_name,
            tokens_in=sum(len(m.content.split()) for m in messages),
            tokens_out=len(content.split()),
            latency_ms=latency_ms,
        )

    async def health(self) -> bool:
        return True
