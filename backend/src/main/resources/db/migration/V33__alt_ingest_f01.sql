-- EP-06 F01 — Ingestão dados alternativos (lab)
CREATE TABLE IF NOT EXISTS tb_alt_data_batch (
    batch_id UUID PRIMARY KEY,
    partner_code VARCHAR(40) NOT NULL,
    utility_type VARCHAR(20) NOT NULL,
    source_uri TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    record_count INTEGER NOT NULL,
    error_rate NUMERIC(7,4) NOT NULL,
    quality_limit NUMERIC(7,4) NOT NULL,
    status VARCHAR(20) NOT NULL,
    rejection_reason TEXT,
    correlation_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_alt_batch_partner ON tb_alt_data_batch (partner_code, received_at DESC);
