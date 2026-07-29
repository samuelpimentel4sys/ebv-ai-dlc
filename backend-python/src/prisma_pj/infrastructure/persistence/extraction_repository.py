from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.infrastructure.persistence.model import (
    PjDocumentRow,
    PjExtractionFieldRow,
    PjExtractionRow,
)


class SqlAlchemyExtractionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_document(
        self,
        *,
        doc_id: uuid.UUID,
        cnpj: str,
        filename: str,
        mime_type: str,
        storage_uri: str,
        sha256: str,
        status: str,
        uploaded_by: uuid.UUID,
    ) -> PjDocumentRow:
        row = PjDocumentRow(
            id=doc_id,
            cnpj=cnpj,
            filename=filename,
            mime_type=mime_type,
            storage_uri=storage_uri,
            sha256=sha256,
            status=status,
            uploaded_by=uploaded_by,
        )
        self._session.add(row)
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def set_document_status(self, doc_id: uuid.UUID, status: str) -> None:
        row = await self.get_document(doc_id)
        if row is None:
            return
        row.status = status
        await self._session.commit()

    async def get_document(self, doc_id: uuid.UUID) -> PjDocumentRow | None:
        return (
            await self._session.execute(
                select(PjDocumentRow).where(PjDocumentRow.id == doc_id)
            )
        ).scalar_one_or_none()

    async def create_extraction(
        self,
        *,
        extraction_id: uuid.UUID,
        document_id: uuid.UUID,
        engine: str,
        status: str,
        threshold: float,
        completed_at: datetime | None = None,
        fields: list[dict[str, Any]] | None = None,
    ) -> PjExtractionRow:
        row = PjExtractionRow(
            id=extraction_id,
            document_id=document_id,
            engine=engine,
            status=status,
            threshold=threshold,
            completed_at=completed_at,
        )
        self._session.add(row)
        await self._session.flush()
        for item in fields or []:
            self._session.add(
                PjExtractionFieldRow(
                    id=uuid.uuid4(),
                    extraction_id=extraction_id,
                    field_key=str(item["field_key"]),
                    value_num=item.get("value_num"),
                    value_text=item.get("value_text"),
                    confidence=float(item["confidence"]),
                    review_status=str(item["review_status"]),
                )
            )
        await self._session.commit()
        await self._session.refresh(row)
        return row

    async def latest_extraction(self, document_id: uuid.UUID) -> PjExtractionRow | None:
        stmt = (
            select(PjExtractionRow)
            .where(PjExtractionRow.document_id == document_id)
            .order_by(PjExtractionRow.completed_at.desc().nullslast())
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def list_fields(self, extraction_id: uuid.UUID) -> list[PjExtractionFieldRow]:
        stmt = select(PjExtractionFieldRow).where(
            PjExtractionFieldRow.extraction_id == extraction_id
        )
        return list((await self._session.execute(stmt)).scalars().all())

    async def find_field(
        self, extraction_id: uuid.UUID, field_key: str
    ) -> PjExtractionFieldRow | None:
        stmt = select(PjExtractionFieldRow).where(
            PjExtractionFieldRow.extraction_id == extraction_id,
            PjExtractionFieldRow.field_key == field_key,
        )
        return (await self._session.execute(stmt)).scalar_one_or_none()

    async def correct_field(
        self,
        field_id: uuid.UUID,
        *,
        corrected_value_num: float,
        corrected_by: uuid.UUID,
    ) -> None:
        row = (
            await self._session.execute(
                select(PjExtractionFieldRow).where(PjExtractionFieldRow.id == field_id)
            )
        ).scalar_one()
        row.corrected_value_num = corrected_value_num
        row.corrected_by = corrected_by
        row.corrected_at = datetime.now(UTC)
        row.review_status = "CORRECTED"
        await self._session.commit()
