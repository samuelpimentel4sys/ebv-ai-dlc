-- F03 Score vivo (contrato US; baseline V1 mantém score_materializado legado)
CREATE TABLE IF NOT EXISTS tb_score_current (
    documento VARCHAR(14) PRIMARY KEY,
    score NUMERIC(6,2) NOT NULL,
    model_version VARCHAR(40) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_event_id UUID
);

CREATE TABLE IF NOT EXISTS tb_score_history (
    id BIGSERIAL PRIMARY KEY,
    documento VARCHAR(14) NOT NULL,
    score NUMERIC(6,2) NOT NULL,
    model_version VARCHAR(40) NOT NULL,
    reason VARCHAR(80) NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_hist_doc
    ON tb_score_history (documento, at DESC);
