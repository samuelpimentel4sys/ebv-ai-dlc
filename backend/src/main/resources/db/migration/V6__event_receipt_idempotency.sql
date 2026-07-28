-- Idempotência F01 (X-Idempotency-Key)
ALTER TABLE tb_event_receipt
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_idempotency
  ON tb_event_receipt (idempotency_key)
  WHERE idempotency_key IS NOT NULL;
