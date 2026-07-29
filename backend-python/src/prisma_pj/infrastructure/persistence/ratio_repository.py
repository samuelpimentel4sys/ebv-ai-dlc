from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.domain.service.ratio_calculator import (
    DEFAULT_RATIO_DEFS,
    RatioDefinition,
    RatioResult,
    calculate_ratio,
)
from prisma_pj.infrastructure.persistence.model import (
    PjRatioBenchmarkRow,
    PjRatioDefRow,
    PjRatioRunRow,
    PjRatioValueRow,
)


class SqlAlchemyRatioRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_definitions(self) -> list[RatioDefinition]:
        rows = (await self._session.execute(select(PjRatioDefRow))).scalars().all()
        if not rows:
            return list(DEFAULT_RATIO_DEFS)
        return [
            RatioDefinition(
                code=r.code,
                formula_expr=r.formula_expr,
                required_fields=tuple(r.required_fields or ()),
            )
            for r in rows
        ]

    async def upsert_run(
        self,
        *,
        cnpj: str,
        fiscal_year: int,
        chart_version: str,
        results: list[RatioResult],
    ) -> uuid.UUID:
        existing = (
            await self._session.execute(
                select(PjRatioRunRow).where(
                    PjRatioRunRow.cnpj == cnpj,
                    PjRatioRunRow.fiscal_year == fiscal_year,
                    PjRatioRunRow.chart_version == chart_version,
                )
            )
        ).scalar_one_or_none()
        if existing:
            run_id = existing.id
            await self._session.execute(
                delete(PjRatioValueRow).where(PjRatioValueRow.run_id == run_id)
            )
        else:
            run_id = uuid.uuid4()
            self._session.add(
                PjRatioRunRow(
                    id=run_id,
                    cnpj=cnpj,
                    fiscal_year=fiscal_year,
                    chart_version=chart_version,
                )
            )
        for result in results:
            self._session.add(
                PjRatioValueRow(
                    id=uuid.uuid4(),
                    run_id=run_id,
                    code=result.code,
                    value=result.value,
                    status=result.status,
                    formula_snapshot=result.formula_snapshot,
                    inputs_json=result.inputs or {},
                    missing_fields=list(result.missing_fields),
                )
            )
        await self._session.commit()
        return run_id

    async def list_by_cnpj(self, cnpj: str) -> list[dict[str, Any]]:
        runs = (
            (
                await self._session.execute(
                    select(PjRatioRunRow)
                    .where(PjRatioRunRow.cnpj == cnpj)
                    .order_by(PjRatioRunRow.calculated_at.desc())
                )
            )
            .scalars()
            .all()
        )
        out: list[dict[str, Any]] = []
        for run in runs:
            values = (
                (
                    await self._session.execute(
                        select(PjRatioValueRow).where(PjRatioValueRow.run_id == run.id)
                    )
                )
                .scalars()
                .all()
            )
            out.append(
                {
                    "runId": str(run.id),
                    "cnpj": run.cnpj.strip(),
                    "fiscalYear": run.fiscal_year,
                    "chartVersion": run.chart_version,
                    "calculatedAt": run.calculated_at.isoformat() if run.calculated_at else None,
                    "ratios": [
                        {
                            "code": v.code,
                            "value": float(v.value) if v.value is not None else None,
                            "status": v.status,
                            "formulaSnapshot": v.formula_snapshot,
                            "missingFields": list(v.missing_fields or []),
                            "inputs": v.inputs_json,
                        }
                        for v in values
                    ],
                }
            )
        return out

    async def benchmarks(self, *, cnae: str, min_sample: int = 30) -> list[dict[str, Any]]:
        rows = (
            (
                await self._session.execute(
                    select(PjRatioBenchmarkRow).where(PjRatioBenchmarkRow.cnae == cnae)
                )
            )
            .scalars()
            .all()
        )
        out: list[dict[str, Any]] = []
        for row in rows:
            if row.sample_size < min_sample:
                out.append(
                    {
                        "code": row.code,
                        "cnae": row.cnae,
                        "omitted": True,
                        "reason": "sample_below_minimum",
                        "sampleSize": row.sample_size,
                    }
                )
            else:
                out.append(
                    {
                        "code": row.code,
                        "cnae": row.cnae,
                        "sectorMedian": float(row.median_value),
                        "sampleSize": row.sample_size,
                    }
                )
        return out


def compute_all(fields: dict[str, float], definitions: list[RatioDefinition]) -> list[RatioResult]:
    return [calculate_ratio(d, fields) for d in definitions]
