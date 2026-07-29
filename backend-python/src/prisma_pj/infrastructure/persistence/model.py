from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, CHAR, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PjDocumentRow(Base):
    __tablename__ = "tb_pj_document"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PjExtractionRow(Base):
    __tablename__ = "tb_pj_extraction"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_pj_document.id", ondelete="CASCADE"),
        nullable=False,
    )
    engine: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    threshold: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PjExtractionFieldRow(Base):
    __tablename__ = "tb_pj_extraction_field"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    extraction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_pj_extraction.id", ondelete="CASCADE"),
        nullable=False,
    )
    field_key: Mapped[str] = mapped_column(String(80), nullable=False)
    value_num: Mapped[float | None] = mapped_column(Numeric(18, 4))
    value_text: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    review_status: Mapped[str] = mapped_column(String(30), nullable=False)
    corrected_value_num: Mapped[float | None] = mapped_column(Numeric(18, 4))
    corrected_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    corrected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PjLibraryDocumentRow(Base):
    __tablename__ = "tb_pj_library_document"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(40), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_uri: Mapped[str] = mapped_column(Text, nullable=False)
    retention_until: Mapped[date] = mapped_column(Date, nullable=False)
    legal_hold: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PjRagChunkRow(Base):
    __tablename__ = "tb_pj_rag_chunk"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    page: Mapped[int] = mapped_column(Integer, nullable=False)
    start_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    end_offset: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Any] = mapped_column(Vector(1536), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(80), nullable=False)
    embedding_dims: Mapped[int] = mapped_column(Integer, nullable=False)
    index_version: Mapped[str] = mapped_column(String(40), nullable=False)
    provider: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PjRagAnswerRow(Base):
    __tablename__ = "tb_pj_rag_answer"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(String(80))
    provider: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PjRagCitationRow(Base):
    __tablename__ = "tb_pj_rag_citation"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    answer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tb_pj_rag_answer.id", ondelete="CASCADE"), nullable=False
    )
    chunk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tb_pj_rag_chunk.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[float] = mapped_column(Numeric(8, 6), nullable=False)


class PjRatioDefRow(Base):
    __tablename__ = "tb_pj_ratio_def"

    code: Mapped[str] = mapped_column(String(40), primary_key=True)
    formula_expr: Mapped[str] = mapped_column(Text, nullable=False)
    required_fields: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)


class PjRatioRunRow(Base):
    __tablename__ = "tb_pj_ratio_run"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    chart_version: Mapped[str] = mapped_column(String(20), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PjRatioValueRow(Base):
    __tablename__ = "tb_pj_ratio_value"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tb_pj_ratio_run.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(
        String(40), ForeignKey("tb_pj_ratio_def.code"), nullable=False
    )
    value: Mapped[float | None] = mapped_column(Numeric(18, 6))
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    formula_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    inputs_json: Mapped[dict[str, float]] = mapped_column(JSONB, nullable=False)
    missing_fields: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)


class PjRatioBenchmarkRow(Base):
    __tablename__ = "tb_pj_ratio_benchmark"

    code: Mapped[str] = mapped_column(
        String(40), ForeignKey("tb_pj_ratio_def.code"), primary_key=True
    )
    cnae: Mapped[str] = mapped_column(String(10), primary_key=True)
    median_value: Mapped[float] = mapped_column(Numeric(18, 6), nullable=False)
    sample_size: Mapped[int] = mapped_column(Integer, nullable=False)


class PjOpinionRow(Base):
    __tablename__ = "tb_pj_opinion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    model_route: Mapped[str | None] = mapped_column(String(40))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    elapsed_ms: Mapped[int | None] = mapped_column(Integer)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    operation_amount: Mapped[float | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str | None] = mapped_column(String(3), default="BRL")


class PjOpinionSectionRow(Base):
    __tablename__ = "tb_pj_opinion_section"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    opinion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tb_pj_opinion.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(40), nullable=False)
    content_md: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    citation_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, default=list
    )


class PjGuardrailReportRow(Base):
    __tablename__ = "tb_pj_guardrail_report"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    opinion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tb_pj_opinion.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PjGuardrailFindingRow(Base):
    __tablename__ = "tb_pj_guardrail_finding"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_pj_guardrail_report.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_code: Mapped[str] = mapped_column(String(40), nullable=False)
    claim: Mapped[str] = mapped_column(Text, nullable=False)
    citation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    result: Mapped[str] = mapped_column(String(20), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)


class PjGroupSnapshotRow(Base):
    __tablename__ = "tb_pj_group_snapshot"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    root_cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    depth: Mapped[int] = mapped_column(Integer, nullable=False)
    node_count: Mapped[int] = mapped_column(Integer, nullable=False)
    truncated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    total_exposure: Mapped[float | None] = mapped_column(Numeric(18, 2))
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    backend: Mapped[str] = mapped_column(String(20), nullable=False, default="stub")
    refreshed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PjGroupEdgeRow(Base):
    __tablename__ = "tb_pj_group_edge"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    snapshot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tb_pj_group_snapshot.id", ondelete="CASCADE"),
        nullable=False,
    )
    from_cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    to_cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    relation: Mapped[str] = mapped_column(String(40), nullable=False)
    share_pct: Mapped[float | None] = mapped_column(Numeric(7, 4))


class PjRelatedAlertRow(Base):
    __tablename__ = "tb_pj_related_alert"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    related_cnpj: Mapped[str] = mapped_column(CHAR(14), nullable=False)
    opinion_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PjRoutingPolicyRow(Base):
    __tablename__ = "tb_pj_routing_policy"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    rules_json: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PjRoutingDecisionRow(Base):
    __tablename__ = "tb_pj_routing_decision"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    task_type: Mapped[str] = mapped_column(String(40), nullable=False)
    model_chosen: Mapped[str] = mapped_column(String(80), nullable=False)
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    opinion_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    promoted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    model_class: Mapped[str | None] = mapped_column(String(20))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PjInferenceCostRow(Base):
    __tablename__ = "tb_pj_inference_cost"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    usd: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False)
    task_type: Mapped[str | None] = mapped_column(String(40))
    provider: Mapped[str | None] = mapped_column(String(20))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

