"""EP-03 P2 — ratios, opinion, guardrails.

Revision ID: 002_ep03_p2
Revises: 001_ep03_pj
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "002_ep03_p2"
down_revision: str | None = "001_ep03_pj"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
CREATE TABLE IF NOT EXISTS public.tb_pj_ratio_def (
  code VARCHAR(40) PRIMARY KEY,
  formula_expr TEXT NOT NULL,
  required_fields TEXT[] NOT NULL
);
CREATE TABLE IF NOT EXISTS public.tb_pj_ratio_run (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  fiscal_year INT NOT NULL,
  chart_version VARCHAR(20) NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cnpj, fiscal_year, chart_version)
);
CREATE TABLE IF NOT EXISTS public.tb_pj_ratio_value (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.tb_pj_ratio_run(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL REFERENCES public.tb_pj_ratio_def(code),
  value NUMERIC(18,6),
  status VARCHAR(20) NOT NULL,
  formula_snapshot TEXT NOT NULL,
  inputs_json JSONB NOT NULL,
  missing_fields TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_ratio_run_cnpj ON public.tb_pj_ratio_run (cnpj);
CREATE TABLE IF NOT EXISTS public.tb_pj_ratio_benchmark (
  code VARCHAR(40) NOT NULL REFERENCES public.tb_pj_ratio_def(code),
  cnae VARCHAR(10) NOT NULL,
  median_value NUMERIC(18,6) NOT NULL,
  sample_size INT NOT NULL,
  PRIMARY KEY (code, cnae)
);
CREATE TABLE IF NOT EXISTS public.tb_pj_opinion (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  status VARCHAR(30) NOT NULL,
  model_route VARCHAR(40),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  elapsed_ms INT,
  created_by UUID NOT NULL,
  operation_amount NUMERIC(18,2),
  currency VARCHAR(3) DEFAULT 'BRL'
);
CREATE INDEX IF NOT EXISTS idx_pj_opinion_cnpj ON public.tb_pj_opinion (cnpj, status);
CREATE TABLE IF NOT EXISTS public.tb_pj_opinion_section (
  id UUID PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.tb_pj_opinion(id) ON DELETE CASCADE,
  code VARCHAR(40) NOT NULL,
  content_md TEXT,
  status VARCHAR(20) NOT NULL,
  citation_ids UUID[] NOT NULL DEFAULT '{}',
  UNIQUE (opinion_id, code)
);
CREATE TABLE IF NOT EXISTS public.tb_pj_guardrail_report (
  id UUID PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.tb_pj_opinion(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  model VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.tb_pj_guardrail_finding (
  id UUID PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.tb_pj_guardrail_report(id) ON DELETE CASCADE,
  section_code VARCHAR(40) NOT NULL,
  claim TEXT NOT NULL,
  citation_id UUID,
  result VARCHAR(20) NOT NULL,
  reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_guard_report_opinion
  ON public.tb_pj_guardrail_report (opinion_id, created_at DESC);

INSERT INTO public.tb_pj_ratio_def (code, formula_expr, required_fields) VALUES
  ('MARGEM_LIQUIDA', 'lucro_liquido / receita_liquida', ARRAY['lucro_liquido','receita_liquida']),
  ('LIQUIDEZ_CORRENTE', 'ativo_circulante / passivo_circulante', ARRAY['ativo_circulante','passivo_circulante']),
  ('ALAVANCAGEM', 'divida_liquida / ebitda', ARRAY['divida_liquida','ebitda']),
  ('ROE', 'lucro_liquido / patrimonio_liquido', ARRAY['lucro_liquido','patrimonio_liquido'])
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.tb_pj_ratio_benchmark (code, cnae, median_value, sample_size) VALUES
  ('MARGEM_LIQUIDA', '6201-5/00', 0.038, 842),
  ('LIQUIDEZ_CORRENTE', '6201-5/00', 1.45, 820),
  ('ALAVANCAGEM', '6201-5/00', 2.30, 790),
  ('ROE', '6201-5/00', 0.12, 800)
ON CONFLICT (code, cnae) DO NOTHING;
"""
    )


def downgrade() -> None:
    op.execute(
        """
DROP TABLE IF EXISTS public.tb_pj_guardrail_finding;
DROP TABLE IF EXISTS public.tb_pj_guardrail_report;
DROP TABLE IF EXISTS public.tb_pj_opinion_section;
DROP TABLE IF EXISTS public.tb_pj_opinion;
DROP TABLE IF EXISTS public.tb_pj_ratio_benchmark;
DROP TABLE IF EXISTS public.tb_pj_ratio_value;
DROP TABLE IF EXISTS public.tb_pj_ratio_run;
DROP TABLE IF EXISTS public.tb_pj_ratio_def;
"""
    )
