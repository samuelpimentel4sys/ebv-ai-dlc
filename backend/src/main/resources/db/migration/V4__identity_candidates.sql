-- Fila humana de pareamento (faixa média RN001)
-- Espelho Supabase: identity_candidates

CREATE TABLE IF NOT EXISTS tb_identity_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  left_gr UUID NOT NULL REFERENCES tb_golden_record (gr_id),
  right_gr UUID NOT NULL REFERENCES tb_golden_record (gr_id),
  confidence NUMERIC(5,4) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_candidate_pair UNIQUE (left_gr, right_gr)
);
CREATE INDEX IF NOT EXISTS ix_candidate_status
  ON tb_identity_candidate (status, created_at DESC);
