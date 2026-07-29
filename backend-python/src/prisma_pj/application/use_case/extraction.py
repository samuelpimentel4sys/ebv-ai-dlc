from __future__ import annotations

import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from prisma_pj.domain.exception import DomainError, NotFoundError
from prisma_pj.infrastructure.persistence.extraction_repository import (
    SqlAlchemyExtractionRepository,
)

_FIXTURES = Path(__file__).resolve().parents[4] / "fixtures" / "f01"
_DEFAULT_THRESHOLD = 0.85
_UPLOADER = uuid.UUID("00000000-0000-4000-8000-000000000001")


@dataclass(frozen=True, slots=True)
class UploadDocumentCommand:
    cnpj: str
    fiscal_year: int
    filename: str
    content: bytes
    mime_type: str = "text/plain"
    uploaded_by: uuid.UUID | None = None
    sync_extract: bool = True


class UploadAndExtractDocument:
    """F01 lab: storage local/stub + extracao sintetica (sem Textract/S3)."""

    def __init__(
        self,
        repo: SqlAlchemyExtractionRepository,
        *,
        threshold: float = _DEFAULT_THRESHOLD,
        storage_root: Path | None = None,
    ) -> None:
        self._repo = repo
        self._threshold = threshold
        self._storage_root = storage_root or (
            Path(__file__).resolve().parents[4] / ".data" / "pj-docs"
        )

    async def execute(self, command: UploadDocumentCommand) -> dict[str, Any]:
        cnpj = _cnpj(command.cnpj)
        if not command.content:
            raise DomainError("arquivo vazio")
        sha = hashlib.sha256(command.content).hexdigest()
        doc_id = uuid.uuid4()
        extraction_id = uuid.uuid4()
        self._storage_root.mkdir(parents=True, exist_ok=True)
        dest = self._storage_root / f"{doc_id}_{command.filename}"
        dest.write_bytes(command.content)
        storage_uri = dest.resolve().as_uri()

        await self._repo.create_document(
            doc_id=doc_id,
            cnpj=cnpj,
            filename=command.filename,
            mime_type=command.mime_type,
            storage_uri=storage_uri,
            sha256=sha,
            status="EXTRACTING",
            uploaded_by=command.uploaded_by or _UPLOADER,
        )

        if not command.sync_extract:
            await self._repo.create_extraction(
                extraction_id=extraction_id,
                document_id=doc_id,
                engine="synthetic-stub-v1",
                status="PENDING",
                threshold=self._threshold,
            )
            return {
                "documentId": str(doc_id),
                "status": "EXTRACTING",
                "cnpj": cnpj,
                "extractionId": str(extraction_id),
                "pollUrl": f"/api/v1/pj/documents/{doc_id}/extraction",
            }

        fields = _resolve_fields(cnpj, command.fiscal_year, command.filename)
        rows = []
        for item in fields:
            conf = float(item["confidence"])
            review = "AUTO_ACCEPTED" if conf >= self._threshold else "PENDING_REVIEW"
            rows.append(
                {
                    "field_key": str(item["fieldKey"]),
                    "value_num": float(item["valueNum"]),
                    "value_text": None,
                    "confidence": conf,
                    "review_status": review,
                }
            )
        await self._repo.create_extraction(
            extraction_id=extraction_id,
            document_id=doc_id,
            engine="synthetic-stub-v1",
            status="COMPLETED",
            threshold=self._threshold,
            completed_at=datetime.now(UTC),
            fields=rows,
        )
        await self._repo.set_document_status(doc_id, "EXTRACTED")
        return {
            "documentId": str(doc_id),
            "status": "EXTRACTED",
            "cnpj": cnpj,
            "extractionId": str(extraction_id),
            "pollUrl": f"/api/v1/pj/documents/{doc_id}/extraction",
            "fieldCount": len(rows),
            "pendingReview": sum(1 for r in rows if r["review_status"] == "PENDING_REVIEW"),
        }


class GetExtraction:
    def __init__(self, repo: SqlAlchemyExtractionRepository) -> None:
        self._repo = repo

    async def execute(self, document_id: uuid.UUID, *, cnpj: str | None = None) -> dict[str, Any]:
        doc = await self._repo.get_document(document_id)
        if doc is None:
            raise NotFoundError("Documento nao encontrado")
        if cnpj and doc.cnpj != _cnpj(cnpj):
            raise DomainError("Cross-CNPJ: documento fora do escopo")
        ext = await self._repo.latest_extraction(document_id)
        if ext is None:
            raise NotFoundError("Extracao nao encontrada")
        fields = await self._repo.list_fields(ext.id)
        return {
            "documentId": str(doc.id),
            "cnpj": doc.cnpj,
            "status": doc.status,
            "extractionId": str(ext.id),
            "engine": ext.engine,
            "extractionStatus": ext.status,
            "threshold": float(ext.threshold),
            "completedAt": ext.completed_at.isoformat() if ext.completed_at else None,
            "fields": [
                {
                    "fieldKey": f.field_key,
                    "valueNum": float(f.value_num) if f.value_num is not None else None,
                    "valueText": f.value_text,
                    "confidence": float(f.confidence),
                    "reviewStatus": f.review_status,
                    "correctedValueNum": float(f.corrected_value_num)
                    if f.corrected_value_num is not None
                    else None,
                }
                for f in fields
            ],
        }


class CorrectExtractionField:
    def __init__(self, repo: SqlAlchemyExtractionRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        document_id: uuid.UUID,
        *,
        field_key: str,
        corrected_value_num: float,
        actor_id: uuid.UUID | None = None,
        cnpj: str | None = None,
    ) -> dict[str, Any]:
        doc = await self._repo.get_document(document_id)
        if doc is None:
            raise NotFoundError("Documento nao encontrado")
        if cnpj and doc.cnpj != _cnpj(cnpj):
            raise DomainError("Cross-CNPJ: documento fora do escopo")
        ext = await self._repo.latest_extraction(document_id)
        if ext is None:
            raise NotFoundError("Extracao nao encontrada")
        field = await self._repo.find_field(ext.id, field_key)
        if field is None:
            raise NotFoundError(f"Campo {field_key} nao encontrado")
        before = float(field.value_num) if field.value_num is not None else None
        await self._repo.correct_field(
            field.id,
            corrected_value_num=corrected_value_num,
            corrected_by=actor_id or _UPLOADER,
        )
        return {
            "documentId": str(document_id),
            "fieldKey": field_key,
            "before": before,
            "after": corrected_value_num,
            "reviewStatus": "CORRECTED",
        }


def _cnpj(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if len(digits) != 14:
        raise DomainError("CNPJ deve ter 14 digitos")
    return digits


def _resolve_fields(cnpj: str, fiscal_year: int, filename: str) -> list[dict[str, Any]]:
    """Casa fixture por CNPJ/ano; fallback gera campos genericos."""
    for path in _FIXTURES.glob("*.json"):
        if path.name in {"companies.json", "SEED_RESULT.json"}:
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            continue
        if data.get("cnpj") == cnpj and int(data.get("fiscalYear", 0)) == fiscal_year:
            return list(data.get("fields") or [])
        if data.get("document", {}).get("filename") == filename:
            return list(data.get("fields") or [])
    # fallback sintetic deterministico
    seed = int(hashlib.sha256(f"{cnpj}:{fiscal_year}".encode()).hexdigest()[:8], 16)
    base = 1_000_000 + (seed % 9_000_000)
    return [
        {"fieldKey": "receita_liquida", "valueNum": float(base), "confidence": 0.95},
        {"fieldKey": "lucro_liquido", "valueNum": float(base * 0.05), "confidence": 0.90},
        {"fieldKey": "ativo_circulante", "valueNum": float(base * 0.3), "confidence": 0.88},
        {"fieldKey": "passivo_circulante", "valueNum": float(base * 0.2), "confidence": 0.87},
        {"fieldKey": "divida_liquida", "valueNum": float(base * 0.4), "confidence": 0.70},
        {"fieldKey": "ebitda", "valueNum": float(base * 0.2), "confidence": 0.91},
        {"fieldKey": "patrimonio_liquido", "valueNum": float(base * 0.5), "confidence": 0.93},
    ]


def load_fixture_payload(name: str) -> dict[str, Any]:
    path = _FIXTURES / name
    if not path.exists():
        raise FileNotFoundError(path)
    return json.loads(path.read_text(encoding="utf-8"))
