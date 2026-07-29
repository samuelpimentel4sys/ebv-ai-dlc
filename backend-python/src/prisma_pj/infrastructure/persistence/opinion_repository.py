from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from prisma_pj.domain.exception import ConflictError, NotFoundError
from prisma_pj.infrastructure.persistence.model import (
    PjGuardrailFindingRow,
    PjGuardrailReportRow,
    PjOpinionRow,
    PjOpinionSectionRow,
    PjRagChunkRow,
)


class SqlAlchemyOpinionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        cnpj: str,
        created_by: uuid.UUID,
        operation_amount: float | None,
        currency: str,
        section_codes: list[str],
    ) -> uuid.UUID:
        opinion_id = uuid.uuid4()
        self._session.add(
            PjOpinionRow(
                id=opinion_id,
                cnpj=cnpj,
                status="GENERATING",
                model_route="local-default",
                created_by=created_by,
                operation_amount=operation_amount,
                currency=currency,
            )
        )
        for code in section_codes:
            self._session.add(
                PjOpinionSectionRow(
                    id=uuid.uuid4(),
                    opinion_id=opinion_id,
                    code=code,
                    content_md=None,
                    status="PENDING",
                    citation_ids=[],
                )
            )
        await self._session.commit()
        return opinion_id

    async def get(self, opinion_id: uuid.UUID) -> dict[str, Any]:
        row = await self._session.get(PjOpinionRow, opinion_id)
        if row is None:
            raise NotFoundError(f"Parecer {opinion_id} não encontrado")
        sections = (
            (
                await self._session.execute(
                    select(PjOpinionSectionRow).where(PjOpinionSectionRow.opinion_id == opinion_id)
                )
            )
            .scalars()
            .all()
        )
        return {
            "opinionId": str(row.id),
            "cnpj": row.cnpj.strip(),
            "status": row.status,
            "modelRoute": row.model_route,
            "elapsedMs": row.elapsed_ms,
            "operationAmount": float(row.operation_amount) if row.operation_amount else None,
            "currency": row.currency,
            "sections": [
                {
                    "code": s.code,
                    "contentMd": s.content_md,
                    "status": s.status,
                    "citationIds": [str(x) for x in (s.citation_ids or [])],
                }
                for s in sections
            ],
        }

    async def update_section(
        self,
        opinion_id: uuid.UUID,
        *,
        code: str,
        content_md: str,
        status: str,
        citation_ids: list[uuid.UUID],
    ) -> None:
        section = (
            await self._session.execute(
                select(PjOpinionSectionRow).where(
                    PjOpinionSectionRow.opinion_id == opinion_id,
                    PjOpinionSectionRow.code == code,
                )
            )
        ).scalar_one_or_none()
        if section is None:
            raise NotFoundError(f"Seção {code} não encontrada")
        section.content_md = content_md
        section.status = status
        section.citation_ids = citation_ids
        flag_modified(section, "citation_ids")
        await self._session.commit()

    async def set_status(
        self,
        opinion_id: uuid.UUID,
        status: str,
        *,
        elapsed_ms: int | None = None,
    ) -> None:
        row = await self._session.get(PjOpinionRow, opinion_id)
        if row is None:
            raise NotFoundError(f"Parecer {opinion_id} não encontrado")
        row.status = status
        if elapsed_ms is not None:
            row.elapsed_ms = elapsed_ms
            row.completed_at = datetime.now(UTC)
        await self._session.commit()

    async def patch_sections(
        self,
        opinion_id: uuid.UUID,
        patches: list[dict[str, str]],
    ) -> dict[str, Any]:
        row = await self._session.get(PjOpinionRow, opinion_id)
        if row is None:
            raise NotFoundError(f"Parecer {opinion_id} não encontrado")
        if row.status in {"SUBMITTED", "APPROVED", "BLOCKED"}:
            raise ConflictError(f"PATCH bloqueado em status {row.status}")
        for patch in patches:
            await self.update_section(
                opinion_id,
                code=patch["code"],
                content_md=patch["contentMd"],
                status="DRAFT",
                citation_ids=[],
            )
        return await self.get(opinion_id)

    async def chunks_by_ids(self, chunk_ids: list[uuid.UUID]) -> dict[uuid.UUID, str]:
        if not chunk_ids:
            return {}
        rows = (
            (
                await self._session.execute(
                    select(PjRagChunkRow).where(PjRagChunkRow.id.in_(chunk_ids))
                )
            )
            .scalars()
            .all()
        )
        return {r.id: r.content for r in rows}


class SqlAlchemyGuardrailRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save_report(
        self,
        *,
        opinion_id: uuid.UUID,
        status: str,
        model: str,
        findings: list[dict[str, Any]],
    ) -> uuid.UUID:
        report_id = uuid.uuid4()
        self._session.add(
            PjGuardrailReportRow(
                id=report_id,
                opinion_id=opinion_id,
                status=status,
                model=model,
            )
        )
        for finding in findings:
            self._session.add(
                PjGuardrailFindingRow(
                    id=uuid.uuid4(),
                    report_id=report_id,
                    section_code=finding["sectionCode"],
                    claim=finding["claim"],
                    citation_id=finding.get("citationId"),
                    result=finding["result"],
                    reason=finding.get("reason"),
                )
            )
        await self._session.commit()
        return report_id

    async def latest_for_opinion(self, opinion_id: uuid.UUID) -> dict[str, Any] | None:
        report = (
            await self._session.execute(
                select(PjGuardrailReportRow)
                .where(PjGuardrailReportRow.opinion_id == opinion_id)
                .order_by(PjGuardrailReportRow.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if report is None:
            return None
        findings = (
            (
                await self._session.execute(
                    select(PjGuardrailFindingRow).where(
                        PjGuardrailFindingRow.report_id == report.id
                    )
                )
            )
            .scalars()
            .all()
        )
        return {
            "reportId": str(report.id),
            "opinionId": str(report.opinion_id),
            "status": report.status,
            "model": report.model,
            "createdAt": report.created_at.isoformat() if report.created_at else None,
            "findings": [
                {
                    "sectionCode": f.section_code,
                    "claim": f.claim,
                    "citationId": str(f.citation_id) if f.citation_id else None,
                    "result": f.result,
                    "reason": f.reason,
                }
                for f in findings
            ],
        }
