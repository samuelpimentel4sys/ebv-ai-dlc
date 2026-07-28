-- EP-04 F02 — Cálculo propagação / contágio (lab stub)
CREATE TABLE IF NOT EXISTS tb_pf_contagion_sim (
    sim_id VARCHAR(40) PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    origin_node_id VARCHAR(80) NOT NULL,
    transmission_factor NUMERIC(8,4) NOT NULL,
    max_waves INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    premises_json TEXT,
    result_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_pf_contagion_portfolio ON tb_pf_contagion_sim (portfolio_id);
