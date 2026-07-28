-- EP-04 F01 — Serviço grafo carteira (lab stub; Neptune real fora)
CREATE TABLE IF NOT EXISTS tb_pf_graph_filter (
    filter_id UUID PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    lod INT NOT NULL DEFAULT 2,
    max_nodes INT NOT NULL DEFAULT 50000,
    criteria_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_pf_graph_filter_portfolio ON tb_pf_graph_filter (portfolio_id);
