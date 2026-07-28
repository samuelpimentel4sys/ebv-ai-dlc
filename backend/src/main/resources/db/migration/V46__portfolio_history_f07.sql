-- EP-04 F07 — Reconstrução estado histórico (lab stub; Iceberg time-travel fora)
CREATE TABLE IF NOT EXISTS tb_pf_snapshot (
    snapshot_id UUID PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    as_of_date DATE NOT NULL,
    aggregate_version VARCHAR(80) NOT NULL,
    summary_json TEXT NOT NULL,
    node_count INT NOT NULL DEFAULT 0,
    divergence_flag BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pf_snapshot_asof ON tb_pf_snapshot (portfolio_id, as_of_date);

CREATE TABLE IF NOT EXISTS tb_pf_timeline_event (
    event_id UUID PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    event_at TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    impact_json TEXT,
    label VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_pf_timeline_portfolio ON tb_pf_timeline_event (portfolio_id, event_at DESC);
