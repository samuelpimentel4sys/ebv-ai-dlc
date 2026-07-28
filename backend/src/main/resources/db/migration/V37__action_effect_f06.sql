-- EP-06 F06 — Efeito estimado de ação (lab)
CREATE TABLE IF NOT EXISTS tb_coach_simulation (
    simulation_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    snapshot_score_id UUID NOT NULL,
    action_code VARCHAR(40) NOT NULL,
    estimable BOOLEAN NOT NULL,
    score_delta_min INTEGER,
    score_delta_max INTEGER,
    effect_days_min INTEGER,
    effect_days_max INTEGER,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_sim_doc ON tb_coach_simulation (documento_hash, created_at DESC);
