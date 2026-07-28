-- PRISMA-EP-01-F07 — Identidade dourada
-- Espelho Supabase migration: identity_golden_record

CREATE TABLE IF NOT EXISTS tb_golden_record (
  gr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_documento CHAR(14) NOT NULL,
  version INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gr_doc_ver
  ON tb_golden_record (canonical_documento, version);

CREATE TABLE IF NOT EXISTS tb_identity_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id UUID NOT NULL REFERENCES tb_golden_record (gr_id),
  source_system VARCHAR(40) NOT NULL,
  source_key VARCHAR(120) NOT NULL,
  confidence NUMERIC(5,4) NOT NULL,
  CONSTRAINT uk_identity_source UNIQUE (source_system, source_key)
);

CREATE INDEX IF NOT EXISTS ix_identity_link_gr
  ON tb_identity_link (gr_id);

CREATE TABLE IF NOT EXISTS tb_identity_merge_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(20) NOT NULL,
  from_gr UUID,
  to_gr UUID,
  actor UUID NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_merge_trail_at
  ON tb_identity_merge_trail (at DESC);
