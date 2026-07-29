"""Smoke e2e: Ollama embed → Supabase pgvector → query isolado por CNPJ."""

from __future__ import annotations

import asyncio
import uuid

from prisma_pj.application.use_case.rag import (
    CreateLibraryCommand,
    CreateLibraryDocument,
    IndexChunkPayload,
    IndexRagCommand,
    IndexRagDocument,
    QueryRag,
    QueryRagCommand,
)
from prisma_pj.infrastructure.ai.factory import build_embedding_gateway
from prisma_pj.infrastructure.config import get_settings
from prisma_pj.infrastructure.persistence.db import reset_db_caches, session_scope
from prisma_pj.infrastructure.persistence.rag_repository import (
    SqlAlchemyLibraryRepository,
    SqlAlchemyRagChunkRepository,
)

CNPJ_A = "12345678000199"
CNPJ_B = "99999999000191"


async def main() -> None:
    get_settings.cache_clear()
    reset_db_caches()
    settings = get_settings()
    embeddings = build_embedding_gateway(settings)
    emb_ok = await embeddings.health()
    print("provider", settings.inference_provider)
    print("embed_model", embeddings.model_name, "dims", embeddings.dimensions, "health", emb_ok)
    print("index_version", settings.rag_index_version)

    doc_id = uuid.uuid4()
    async for session in session_scope():
        rag_repo = SqlAlchemyRagChunkRepository(session)
        lib_repo = SqlAlchemyLibraryRepository(session)

        lib = CreateLibraryDocument(lib_repo)
        lib_doc = await lib.execute(
            CreateLibraryCommand(
                cnpj=CNPJ_A,
                doc_type="BALANCO",
                filename="smoke-balanco-2025.pdf",
                storage_uri=f"s3://prisma-pj-lab/{doc_id}.pdf",
                retention_until="2031-12-31",
            )
        )
        print("library_id", lib_doc.id, "status", lib_doc.status)

        indexer = IndexRagDocument(
            rag_repo,
            embeddings,
            index_version=settings.rag_index_version,
            canonical_dims=settings.rag_vector_dims,
        )
        indexed = await indexer.execute(
            IndexRagCommand(
                cnpj=CNPJ_A,
                document_id=doc_id,
                chunks=[
                    IndexChunkPayload(
                        page=12,
                        start=1040,
                        end=1388,
                        content=(
                            "A margem líquida passou de 4,2% em 2023 para 5,1% em 2025, "
                            "indicando melhora na rentabilidade do grupo."
                        ),
                    ),
                    IndexChunkPayload(
                        page=3,
                        start=200,
                        end=480,
                        content=(
                            "O endividamento líquido/EBITDA encerrou em 2,1x, "
                            "dentro da política de crédito PJ."
                        ),
                    ),
                ],
            )
        )
        print("indexed", indexed)

        query = QueryRag(
            rag_repo,
            embeddings,
            index_version=settings.rag_index_version,
            canonical_dims=settings.rag_vector_dims,
        )
        hit_a = await query.execute(
            QueryRagCommand(
                cnpj=CNPJ_A,
                query="Qual a evolução da margem líquida nos últimos exercícios?",
                top_k=5,
            )
        )
        print("query_A_answer", hit_a["answerId"])
        print("query_A_hits", len(hit_a["chunks"]))  # type: ignore[arg-type]
        for chunk in hit_a["chunks"]:  # type: ignore[union-attr]
            print(
                "  hit",
                f"page={chunk['page']}",
                f"score={chunk['score']}",
                f"excerpt={chunk['excerpt'][:80]}...",
            )

        hit_b = await query.execute(
            QueryRagCommand(
                cnpj=CNPJ_B,
                query="Qual a evolução da margem líquida nos últimos exercícios?",
                top_k=5,
            )
        )
        print("query_B_hits", len(hit_b["chunks"]))  # type: ignore[arg-type]
        if hit_b["chunks"]:
            raise SystemExit("FAIL: isolamento CNPJ quebrado — CNPJ_B viu chunks de A")
        print("isolation_ok True")
        print("SMOKE_E2E_OK")
        break


if __name__ == "__main__":
    asyncio.run(main())
