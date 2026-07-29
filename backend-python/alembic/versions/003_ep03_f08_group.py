"""EP-03 F08 — group snapshot / edges / related alerts.

Revision ID: 003_ep03_f08
Revises: 002_ep03_p2
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "003_ep03_f08"
down_revision: str | None = "002_ep03_p2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STATEMENTS = [
    """
CREATE TABLE IF NOT EXISTS public.tb_pj_group_snapshot (
  id UUID PRIMARY KEY,
  root_cnpj CHAR(14) NOT NULL,
  depth INT NOT NULL,
  node_count INT NOT NULL,
  truncated BOOLEAN NOT NULL DEFAULT FALSE,
  total_exposure NUMERIC(18,2),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  backend VARCHAR(20) NOT NULL DEFAULT 'stub',
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
    """
CREATE INDEX IF NOT EXISTS idx_pj_group_root
  ON public.tb_pj_group_snapshot (root_cnpj, refreshed_at DESC)
""",
    """
CREATE TABLE IF NOT EXISTS public.tb_pj_group_edge (
  id UUID PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.tb_pj_group_snapshot(id) ON DELETE CASCADE,
  from_cnpj CHAR(14) NOT NULL,
  to_cnpj CHAR(14) NOT NULL,
  relation VARCHAR(40) NOT NULL,
  share_pct NUMERIC(7,4)
)
""",
    """
CREATE INDEX IF NOT EXISTS idx_pj_group_edge_snap
  ON public.tb_pj_group_edge (snapshot_id)
""",
    """
CREATE TABLE IF NOT EXISTS public.tb_pj_related_alert (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  related_cnpj CHAR(14) NOT NULL,
  opinion_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
    """
CREATE INDEX IF NOT EXISTS idx_pj_related_alert_cnpj
  ON public.tb_pj_related_alert (cnpj, created_at DESC)
""",
]


def upgrade() -> None:
    for stmt in _STATEMENTS:
        op.execute(stmt)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS public.tb_pj_related_alert")
    op.execute("DROP TABLE IF EXISTS public.tb_pj_group_edge")
    op.execute("DROP TABLE IF EXISTS public.tb_pj_group_snapshot")
