"""Smoke P2: ratios + opinion (LLM) + guardrails no Supabase."""

from __future__ import annotations

import asyncio
import uuid

from prisma_pj.application.use_case.copilot import (
    CalculateRatios,
    CalculateRatiosCommand,
    CreateOpinionCommand,
    GenerateOpinion,
    VerifyGuardrailCommand,
    VerifyOpinionGuardrails,
)
from prisma_pj.application.use_case.rag import QueryRag
from prisma_pj.infrastructure.ai.factory import build_embedding_gateway, build_llm_gateway
from prisma_pj.infrastructure.config import get_settings
from prisma_pj.infrastructure.persistence.db import reset_db_caches, session_scope
from prisma_pj.infrastructure.persistence.opinion_repository import (
    SqlAlchemyGuardrailRepository,
    SqlAlchemyOpinionRepository,
)
from prisma_pj.infrastructure.persistence.rag_repository import SqlAlchemyRagChunkRepository
from prisma_pj.infrastructure.persistence.ratio_repository import SqlAlchemyRatioRepository

CNPJ = "12345678000199"


async def main() -> None:
    get_settings.cache_clear()
    reset_db_caches()
    settings = get_settings()
    llm = build_llm_gateway(settings)
    embeddings = build_embedding_gateway(settings)
    print("llm", llm.model_name, "health", await llm.health())

    async for session in session_scope():
        ratios = CalculateRatios(SqlAlchemyRatioRepository(session))
        calc = await ratios.execute(
            CalculateRatiosCommand(
                cnpj=CNPJ,
                fiscal_year=2025,
                chart_version="CANON-2026.1",
                fields={
                    "lucro_liquido": 510_000,
                    "receita_liquida": 10_000_000,
                    "ativo_circulante": 3_000_000,
                    "passivo_circulante": 2_000_000,
                    "divida_liquida": 4_200_000,
                    "ebitda": 2_000_000,
                    "patrimonio_liquido": 5_000_000,
                },
                cnae="6201-5/00",
            )
        )
        print("ratios_run", calc["runId"])
        for item in calc["ratios"]:  # type: ignore[union-attr]
            print(" ", item["code"], item["status"], item.get("value"))

        query_rag = QueryRag(
            SqlAlchemyRagChunkRepository(session),
            embeddings,
            index_version=settings.rag_index_version,
            canonical_dims=settings.rag_vector_dims,
        )
        gen = GenerateOpinion(SqlAlchemyOpinionRepository(session), llm, query_rag)
        opinion = await gen.execute(
            CreateOpinionCommand(
                cnpj=CNPJ,
                sections=["RESUMO", "INDICES"],
                operation_amount=2_500_000,
                sync=True,
            )
        )
        print(
            "opinion", opinion["opinionId"], opinion["status"], "elapsed", opinion.get("elapsedMs")
        )
        for section in opinion["sections"]:  # type: ignore[union-attr]
            print(
                " section",
                section["code"],
                section["status"],
                "cites",
                len(section.get("citationIds") or []),
            )

        verify = VerifyOpinionGuardrails(
            SqlAlchemyOpinionRepository(session),
            SqlAlchemyGuardrailRepository(session),
        )
        report = await verify.execute(
            VerifyGuardrailCommand(opinion_id=uuid.UUID(str(opinion["opinionId"])))
        )
        print("guardrail", report["status"], "findings", len(report["findings"]))  # type: ignore[arg-type]
        print("SMOKE_P2_OK")
        break


if __name__ == "__main__":
    asyncio.run(main())
