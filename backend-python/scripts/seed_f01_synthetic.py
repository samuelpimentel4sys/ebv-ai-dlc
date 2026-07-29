"""Seed massa sintetica F01 (3 empresas) no Supabase + opcional RAG.

  uv run python scripts/seed_f01_synthetic.py
  uv run python scripts/seed_f01_synthetic.py --with-rag
"""

from __future__ import annotations

import argparse
import asyncio
import json
import uuid
from pathlib import Path

from prisma_pj.application.use_case.extraction import (
    UploadAndExtractDocument,
    UploadDocumentCommand,
)
from prisma_pj.application.use_case.rag import IndexChunkPayload, IndexRagCommand, IndexRagDocument
from prisma_pj.infrastructure.ai.factory import build_embedding_gateway
from prisma_pj.infrastructure.config import get_settings
from prisma_pj.infrastructure.persistence.db import reset_db_caches, session_scope
from prisma_pj.infrastructure.persistence.extraction_repository import (
    SqlAlchemyExtractionRepository,
)
from prisma_pj.infrastructure.persistence.rag_repository import SqlAlchemyRagChunkRepository

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "f01"


async def seed(*, with_rag: bool) -> None:
    get_settings.cache_clear()
    reset_db_caches()
    settings = get_settings()
    meta = json.loads((FIXTURES / "companies.json").read_text(encoding="utf-8"))
    print("engine", meta.get("engine"), "threshold", meta.get("threshold"))

    results: list[dict[str, object]] = []
    async for session in session_scope():
        upload = UploadAndExtractDocument(
            SqlAlchemyExtractionRepository(session),
            threshold=float(meta.get("threshold") or 0.85),
        )
        for path in sorted(FIXTURES.glob("*.json")):
            if path.name in {"companies.json", "SEED_RESULT.json"}:
                continue
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, dict) or "document" not in data:
                continue
            doc_meta = data["document"]
            doc_path = FIXTURES / "docs" / doc_meta["filename"]
            content = doc_path.read_bytes()
            out = await upload.execute(
                UploadDocumentCommand(
                    cnpj=str(data["cnpj"]),
                    fiscal_year=int(data["fiscalYear"]),
                    filename=str(doc_meta["filename"]),
                    content=content,
                    mime_type=str(doc_meta.get("mimeType") or "text/plain"),
                    sync_extract=True,
                )
            )
            print(
                "seed",
                data["cnpj"],
                out["documentId"],
                out["status"],
                "pending",
                out.get("pendingReview"),
            )
            results.append({"fixture": path.name, **out, "ragPages": data.get("ragPages") or []})

            if with_rag:
                emb = build_embedding_gateway(settings)
                indexer = IndexRagDocument(
                    SqlAlchemyRagChunkRepository(session),
                    emb,
                    index_version=settings.rag_index_version,
                    canonical_dims=settings.rag_vector_dims,
                )
                chunks = []
                offset = 0
                for i, page in enumerate(data.get("ragPages") or []):
                    text = str(page)
                    chunks.append(
                        IndexChunkPayload(
                            page=i + 1,
                            start=offset,
                            end=offset + len(text),
                            content=text,
                        )
                    )
                    offset += len(text) + 1
                if chunks:
                    indexed = await indexer.execute(
                        IndexRagCommand(
                            cnpj=str(data["cnpj"]),
                            document_id=uuid.UUID(str(out["documentId"])),
                            chunks=chunks,
                        )
                    )
                    print("  rag_chunks", indexed.get("chunksIndexed") or indexed)
        break

    summary = ROOT / "fixtures" / "f01" / "SEED_RESULT.json"
    summary.write_text(
        json.dumps(
            [{"fixture": r["fixture"], "documentId": r["documentId"], "cnpj": r["cnpj"]} for r in results],
            indent=2,
        ),
        encoding="utf-8",
    )
    print("wrote", summary)
    print("SEED_F01_OK", len(results))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-rag", action="store_true")
    args = parser.parse_args()
    asyncio.run(seed(with_rag=args.with_rag))
