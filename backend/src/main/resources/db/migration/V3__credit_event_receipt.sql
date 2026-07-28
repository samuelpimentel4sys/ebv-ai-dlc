-- PRISMA-EP-01-F01 — Recebimento e DLQ de eventos de crédito
-- Espelho Supabase migration: credit_event_receipt

CREATE TABLE IF NOT EXISTS tb_event_receipt (
  event_id UUID PRIMARY KEY,
  documento CHAR(14) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  partition_id INT NOT NULL,
  offset_id BIGINT NOT NULL,
  schema_version VARCHAR(40) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_receipt_doc
  ON tb_event_receipt (documento, received_at DESC);

CREATE TABLE IF NOT EXISTS tb_event_dlq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_payload JSONB NOT NULL,
  reason VARCHAR(200) NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
