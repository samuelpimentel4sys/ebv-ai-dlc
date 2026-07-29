from __future__ import annotations

import re
import time
import uuid
from dataclasses import dataclass
from typing import Any

from prisma_pj.application.use_case.rag import QueryRag, QueryRagCommand
from prisma_pj.domain.exception import (
    ConflictError,
    DomainError,
    NotFoundError,
    ValidationRejectedError,
)
from prisma_pj.domain.port.outbound.llm_gateway import ChatMessage, LlmGateway
from prisma_pj.domain.service.guardrail_numbers import number_grounded_in_source
from prisma_pj.infrastructure.persistence.opinion_repository import (
    SqlAlchemyGuardrailRepository,
    SqlAlchemyOpinionRepository,
)
from prisma_pj.infrastructure.persistence.ratio_repository import (
    SqlAlchemyRatioRepository,
    compute_all,
)

_CNPJ_RE = re.compile(r"^\d{14}$")
_ALLOWED_SECTIONS = frozenset({"RESUMO", "INDICES", "RISCOS", "RECOMENDACAO"})
_MIN_BENCHMARK_SAMPLE = 30
_CANON_CHART = "CANON-2026.1"


def _cnpj(value: str) -> str:
    normalized = value.strip()
    if not _CNPJ_RE.match(normalized):
        raise DomainError("CNPJ deve ter 14 dígitos")
    return normalized


@dataclass(frozen=True, slots=True)
class CalculateRatiosCommand:
    cnpj: str
    fiscal_year: int
    chart_version: str
    fields: dict[str, float]
    force_estimate: bool = False
    cnae: str | None = None


class CalculateRatios:
    def __init__(self, repository: SqlAlchemyRatioRepository) -> None:
        self._repository = repository

    async def execute(self, command: CalculateRatiosCommand) -> dict[str, object]:
        if command.force_estimate:
            raise ValidationRejectedError("forceEstimate proibido (RN003)")
        if command.chart_version != _CANON_CHART:
            raise ConflictError(f"chartVersion divergente: esperado {_CANON_CHART}")
        cnpj = _cnpj(command.cnpj)
        definitions = await self._repository.list_definitions()
        results = compute_all(command.fields, definitions)
        run_id = await self._repository.upsert_run(
            cnpj=cnpj,
            fiscal_year=command.fiscal_year,
            chart_version=command.chart_version,
            results=results,
        )
        benchmarks: dict[str, dict[str, object]] = {}
        if command.cnae:
            for bench_row in await self._repository.benchmarks(
                cnae=command.cnae, min_sample=_MIN_BENCHMARK_SAMPLE
            ):
                benchmarks[str(bench_row["code"])] = bench_row
        ratios_out: list[dict[str, object]] = []
        for result in results:
            ratio_item: dict[str, object] = {
                "code": result.code,
                "status": result.status,
                "formulaSnapshot": result.formula_snapshot,
            }
            if result.status == "COMPUTED":
                ratio_item["value"] = result.value
                ratio_item["inputs"] = result.inputs
                bench = benchmarks.get(result.code)
                if bench and not bench.get("omitted"):
                    ratio_item["sectorMedian"] = bench.get("sectorMedian")
                    ratio_item["sectorSampleSize"] = bench.get("sampleSize")
            else:
                ratio_item["missingFields"] = list(result.missing_fields)
            ratios_out.append(ratio_item)
        return {"runId": str(run_id), "ratios": ratios_out}


class ListRatiosByCnpj:
    def __init__(self, repository: SqlAlchemyRatioRepository) -> None:
        self._repository = repository

    async def execute(self, cnpj: str) -> list[dict[str, Any]]:
        return await self._repository.list_by_cnpj(_cnpj(cnpj))


class ListRatioBenchmarks:
    def __init__(self, repository: SqlAlchemyRatioRepository) -> None:
        self._repository = repository

    async def execute(self, cnae: str) -> list[dict[str, Any]]:
        return await self._repository.benchmarks(cnae=cnae, min_sample=_MIN_BENCHMARK_SAMPLE)


@dataclass(frozen=True, slots=True)
class CreateOpinionCommand:
    cnpj: str
    sections: list[str]
    operation_amount: float | None = None
    currency: str = "BRL"
    created_by: uuid.UUID | None = None
    sync: bool = True  # lab: gera síncrono


class GenerateOpinion:
    """F03 — gera seções com RAG + LLM; timeout parcial (lab sync)."""

    def __init__(
        self,
        opinions: SqlAlchemyOpinionRepository,
        llm: LlmGateway,
        query_rag: QueryRag,
        *,
        sla_ms: int = 180_000,
    ) -> None:
        self._opinions = opinions
        self._llm = llm
        self._query_rag = query_rag
        self._sla_ms = sla_ms

    async def execute(self, command: CreateOpinionCommand) -> dict[str, object]:
        cnpj = _cnpj(command.cnpj)
        sections = [s.upper() for s in command.sections] or list(_ALLOWED_SECTIONS)
        unknown = [s for s in sections if s not in _ALLOWED_SECTIONS]
        if unknown:
            raise DomainError(f"Seções inválidas: {unknown}")
        created_by = command.created_by or uuid.UUID("00000000-0000-4000-8000-000000000001")
        opinion_id = await self._opinions.create(
            cnpj=cnpj,
            created_by=created_by,
            operation_amount=command.operation_amount,
            currency=command.currency,
            section_codes=sections,
        )
        if not command.sync:
            return {
                "opinionId": str(opinion_id),
                "status": "GENERATING",
                "slaMs": self._sla_ms,
                "pollUrl": f"/api/v1/pj/opinions/{opinion_id}",
            }

        started = time.perf_counter()
        partial = False
        for code in sections:
            elapsed = int((time.perf_counter() - started) * 1000)
            if elapsed > self._sla_ms:
                partial = True
                break
            rag = await self._query_rag.execute(
                QueryRagCommand(
                    cnpj=cnpj,
                    query=f"Trechos relevantes para seção {code} do parecer de crédito PJ",
                    top_k=4,
                )
            )
            chunks_raw = rag["chunks"]
            chunks: list[dict[str, Any]] = list(chunks_raw) if isinstance(chunks_raw, list) else []
            citation_ids = [uuid.UUID(str(c["chunkId"])) for c in chunks]
            context = "\n\n".join(
                f"[{i}] (doc={c['documentId']} p.{c['page']}) {c['excerpt']}"
                for i, c in enumerate(chunks)
            )
            prompt = (
                f"Escreva a seção {code} de um parecer de crédito PJ em português. "
                f"Use APENAS o contexto abaixo. Se faltar evidência, diga que está UNVERIFIED.\n"
                f"Operação: {command.operation_amount} {command.currency}\n"
                f"Contexto:\n{context or '(sem trechos)'}\n"
                f"Responda em markdown, 1-3 parágrafos."
            )
            try:
                llm_result = await self._llm.complete(
                    [
                        ChatMessage(
                            role="system",
                            content="Você é analista de crédito PJ. Sem inventar números.",
                        ),
                        ChatMessage(role="user", content=prompt),
                    ],
                    temperature=0.2,
                    max_tokens=600,
                )
                content = llm_result.content
                status = "READY" if citation_ids else "UNVERIFIED"
            except Exception as exc:
                content = f"_Falha na geração: {exc}_"
                status = "UNVERIFIED"
                citation_ids = []
            await self._opinions.update_section(
                opinion_id,
                code=code,
                content_md=content,
                status=status,
                citation_ids=citation_ids,
            )

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        final_status = "PARTIAL" if partial else "DRAFT"
        await self._opinions.set_status(opinion_id, final_status, elapsed_ms=elapsed_ms)
        payload = await self._opinions.get(opinion_id)
        payload["slaMs"] = self._sla_ms
        payload["partial"] = partial
        return payload


class GetOpinion:
    def __init__(self, opinions: SqlAlchemyOpinionRepository) -> None:
        self._opinions = opinions

    async def execute(self, opinion_id: uuid.UUID) -> dict[str, Any]:
        return await self._opinions.get(opinion_id)


class PatchOpinion:
    def __init__(self, opinions: SqlAlchemyOpinionRepository) -> None:
        self._opinions = opinions

    async def execute(self, opinion_id: uuid.UUID, patches: list[dict[str, str]]) -> dict[str, Any]:
        return await self._opinions.patch_sections(opinion_id, patches)


@dataclass(frozen=True, slots=True)
class VerifyGuardrailCommand:
    opinion_id: uuid.UUID


class VerifyOpinionGuardrails:
    """F06 — RN001 lastro numérico determinístico (+ modelo marcado)."""

    def __init__(
        self,
        opinions: SqlAlchemyOpinionRepository,
        guardrails: SqlAlchemyGuardrailRepository,
    ) -> None:
        self._opinions = opinions
        self._guardrails = guardrails

    async def execute(self, command: VerifyGuardrailCommand) -> dict[str, object]:
        opinion = await self._opinions.get(command.opinion_id)
        findings: list[dict[str, object]] = []
        failed = False
        for section in opinion["sections"]:
            content = section.get("contentMd") or ""
            citation_ids = [uuid.UUID(x) for x in section.get("citationIds") or []]
            sources = await self._opinions.chunks_by_ids(citation_ids)
            # cada parágrafo = claim
            claims = [
                p.strip() for p in str(content).split("\n") if p.strip() and not p.startswith("_")
            ]
            if not claims:
                continue
            for claim in claims:
                if not citation_ids:
                    findings.append(
                        {
                            "sectionCode": section["code"],
                            "claim": claim[:500],
                            "citationId": None,
                            "result": "REJECTED",
                            "reason": "sem citationIds (RN002 F03 / RN001 F06)",
                        }
                    )
                    failed = True
                    continue
                # lastro: número deve existir em AO MENOS um chunk citado
                grounded = any(
                    number_grounded_in_source(claim, sources.get(cid, "")) for cid in citation_ids
                )
                if grounded:
                    findings.append(
                        {
                            "sectionCode": section["code"],
                            "claim": claim[:500],
                            "citationId": citation_ids[0],
                            "result": "PASSED",
                            "reason": None,
                        }
                    )
                else:
                    findings.append(
                        {
                            "sectionCode": section["code"],
                            "claim": claim[:500],
                            "citationId": citation_ids[0],
                            "result": "REJECTED",
                            "reason": "número sem lastro no trecho citado (RN001)",
                        }
                    )
                    failed = True

        status = "FAILED" if failed else "PASSED"
        report_id = await self._guardrails.save_report(
            opinion_id=command.opinion_id,
            status=status,
            model="deterministic-number-grounding-v1",
            findings=findings,
        )
        if failed:
            await self._opinions.set_status(command.opinion_id, "BLOCKED")
        elif opinion["status"] in {"DRAFT", "PARTIAL", "GENERATING"}:
            await self._opinions.set_status(command.opinion_id, "READY_FOR_REVIEW")

        return {
            "reportId": str(report_id),
            "opinionId": str(command.opinion_id),
            "status": status,
            "findings": [
                {
                    **f,
                    "citationId": str(f["citationId"]) if f.get("citationId") else None,
                }
                for f in findings
            ],
        }


class GetGuardrailReport:
    def __init__(self, guardrails: SqlAlchemyGuardrailRepository) -> None:
        self._guardrails = guardrails

    async def execute(self, opinion_id: uuid.UUID) -> dict[str, Any]:
        report = await self._guardrails.latest_for_opinion(opinion_id)
        if report is None:
            raise NotFoundError(f"Report não encontrado para parecer {opinion_id}")
        return report
