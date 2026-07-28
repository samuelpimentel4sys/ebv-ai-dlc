-- F10 Replay histórico isolado (sandbox) — proibido PRODUCTION_BUS
CREATE TABLE IF NOT EXISTS tb_replay_job (
    id UUID PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL,
    requester UUID NOT NULL,
    approver UUID NOT NULL,
    justification TEXT NOT NULL,
    output_uri TEXT,
    target_env VARCHAR(20) NOT NULL CHECK (target_env <> 'PRODUCTION_BUS'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_replay_job_status ON tb_replay_job(status);
