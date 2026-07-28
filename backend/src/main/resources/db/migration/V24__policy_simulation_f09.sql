-- EP-02 F09 — Policy what-if simulation (lab stub; Spark later)
CREATE TABLE IF NOT EXISTS tb_policy_simulation (
    id UUID PRIMARY KEY,
    candidate_policy TEXT NOT NULL,
    sample_ref VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL,
    metrics_json TEXT,
    result_json TEXT,
    baseline_version VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_policy_simulation_status ON tb_policy_simulation(status);
CREATE INDEX IF NOT EXISTS idx_policy_simulation_created ON tb_policy_simulation(created_at DESC);
