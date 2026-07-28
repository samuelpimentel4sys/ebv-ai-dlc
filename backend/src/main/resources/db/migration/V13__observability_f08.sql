-- F08 Observabilidade SLO — snapshot + traces (hot 7d); latência via tb_decision.latency_ms
CREATE TABLE IF NOT EXISTS tb_slo_snapshot (
    id BIGSERIAL PRIMARY KEY,
    at TIMESTAMPTZ NOT NULL,
    client_id VARCHAR(64),
    p95_ms NUMERIC(10,2) NOT NULL,
    p99_ms NUMERIC(10,2) NOT NULL,
    error_rate NUMERIC(8,6) NOT NULL,
    budget_remaining_pct NUMERIC(5,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_slo_at ON tb_slo_snapshot(at DESC);

CREATE TABLE IF NOT EXISTS tb_decision_trace (
    decision_id UUID PRIMARY KEY,
    client_id VARCHAR(64),
    span_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_decision_trace_expires ON tb_decision_trace(expires_at);
