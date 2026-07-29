-- EP-03 F08 — consolidacao grupo (stub Neptune)
-- Aplicar no Supabase Prisma Equifax se Alembic nao rodar

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
);
CREATE INDEX IF NOT EXISTS idx_pj_group_root
  ON public.tb_pj_group_snapshot (root_cnpj, refreshed_at DESC);

CREATE TABLE IF NOT EXISTS public.tb_pj_group_edge (
  id UUID PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES public.tb_pj_group_snapshot(id) ON DELETE CASCADE,
  from_cnpj CHAR(14) NOT NULL,
  to_cnpj CHAR(14) NOT NULL,
  relation VARCHAR(40) NOT NULL,
  share_pct NUMERIC(7,4)
);

CREATE TABLE IF NOT EXISTS public.tb_pj_related_alert (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  related_cnpj CHAR(14) NOT NULL,
  opinion_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
