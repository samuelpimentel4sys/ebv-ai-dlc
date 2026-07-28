-- EP-04 F06 — Detecção algorítmica comunidades (lab stub; Louvain/Neptune fora)
CREATE TABLE IF NOT EXISTS tb_pf_community_run (
    run_id VARCHAR(40) PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    algorithm VARCHAR(40) NOT NULL,
    min_community_size INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tb_pf_community (
    community_id VARCHAR(40) PRIMARY KEY,
    run_id VARCHAR(40) NOT NULL,
    portfolio_id UUID NOT NULL,
    label VARCHAR(120),
    total_exposure NUMERIC(18,2) NOT NULL DEFAULT 0,
    member_count INT NOT NULL DEFAULT 0,
    members_json TEXT
);
CREATE INDEX IF NOT EXISTS ix_pf_community_portfolio ON tb_pf_community (portfolio_id);
