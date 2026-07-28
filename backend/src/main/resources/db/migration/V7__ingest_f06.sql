CREATE TABLE IF NOT EXISTS tb_ingest_source (
    code VARCHAR(40) PRIMARY KEY,
    type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_success_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tb_ingest_dedup (
    source VARCHAR(40) NOT NULL,
    natural_key VARCHAR(200) NOT NULL,
    event_ts TIMESTAMPTZ NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    PRIMARY KEY (source, natural_key, event_ts)
);

CREATE TABLE IF NOT EXISTS tb_consent_cache (
    documento VARCHAR(14) NOT NULL,
    purpose VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (documento, purpose)
);

INSERT INTO tb_ingest_source (code, type, status, last_success_at) VALUES
    ('OPEN_FINANCE', 'CALLBACK', 'UP', NULL),
    ('CADASTRO_POSITIVO', 'BATCH', 'UP', NULL)
ON CONFLICT (code) DO NOTHING;
