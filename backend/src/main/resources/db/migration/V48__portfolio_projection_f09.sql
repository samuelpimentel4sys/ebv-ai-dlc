-- EP-04 F09 — Projeção 2D / tabular (lab stub)
CREATE TABLE IF NOT EXISTS tb_pf_projection_cache (
    cache_id UUID PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    filter_id VARCHAR(40),
    kind VARCHAR(20) NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_pf_projection_portfolio ON tb_pf_projection_cache (portfolio_id, kind);
