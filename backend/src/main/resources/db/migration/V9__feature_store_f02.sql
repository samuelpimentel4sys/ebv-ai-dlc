-- F02 Feature Store PIT
CREATE TABLE IF NOT EXISTS tb_feature_catalog (
    name VARCHAR(120) PRIMARY KEY,
    entity VARCHAR(40) NOT NULL,
    value_type VARCHAR(40) NOT NULL,
    max_age_seconds INT NOT NULL,
    owner VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_feature_online (
    documento VARCHAR(14) NOT NULL,
    feature_name VARCHAR(120) NOT NULL,
    value_json TEXT NOT NULL,
    event_ts TIMESTAMPTZ NOT NULL,
    written_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (documento, feature_name, event_ts)
);

CREATE INDEX IF NOT EXISTS idx_feat_online_doc
    ON tb_feature_online (documento, feature_name, event_ts DESC);

CREATE TABLE IF NOT EXISTS tb_feature_online_audit (
    id BIGSERIAL PRIMARY KEY,
    documento VARCHAR(14) NOT NULL,
    feature_name VARCHAR(120) NOT NULL,
    event_ts TIMESTAMPTZ NOT NULL,
    written_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feat_online_audit_doc
    ON tb_feature_online_audit (documento, feature_name, event_ts DESC);

INSERT INTO tb_feature_catalog (name, entity, value_type, max_age_seconds, owner, active) VALUES
    ('divida_aberta', 'TITULAR', 'DOUBLE', 86400, 'risk-data', TRUE),
    ('qtd_negativacoes_12m', 'TITULAR', 'INT', 86400, 'risk-data', TRUE)
ON CONFLICT (name) DO NOTHING;
