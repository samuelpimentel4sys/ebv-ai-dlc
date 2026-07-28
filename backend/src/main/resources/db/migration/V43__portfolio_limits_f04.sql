-- EP-04 F04 — Vigilância contínua limites (lab stub)
CREATE TABLE IF NOT EXISTS tb_pf_limit (
    limit_id UUID PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    dimension VARCHAR(40) NOT NULL,
    threshold_pct NUMERIC(8,4) NOT NULL,
    warn_pct NUMERIC(8,4) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_pf_limit_portfolio_dim ON tb_pf_limit (portfolio_id, dimension);

CREATE TABLE IF NOT EXISTS tb_pf_alert (
    alert_id UUID PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    dimension VARCHAR(40) NOT NULL,
    dim_key VARCHAR(80) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_pf_alert_portfolio ON tb_pf_alert (portfolio_id, status);
