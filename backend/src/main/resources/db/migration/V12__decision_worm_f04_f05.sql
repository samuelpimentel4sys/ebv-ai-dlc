-- F04 Snapshot WORM + F05 Decisão síncrona (tb_decision nova; baseline V1 mantém decisao legada)
CREATE TABLE IF NOT EXISTS tb_decision (
    decision_id UUID PRIMARY KEY,
    documento VARCHAR(14) NOT NULL,
    score NUMERIC(6,2) NOT NULL,
    model_version VARCHAR(40) NOT NULL,
    outcome VARCHAR(40),
    sha256 CHAR(64) NOT NULL,
    prev_sha256 CHAR(64),
    storage_uri TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latency_ms INT,
    degraded_flags TEXT[],
    client_id VARCHAR(64),
    partial BOOLEAN NOT NULL DEFAULT FALSE,
    product_code VARCHAR(40),
    explanation_ref TEXT,
    locked_until DATE
);

CREATE INDEX IF NOT EXISTS idx_decision_doc
    ON tb_decision (documento, created_at DESC);
