-- EP-02 F05 — Reasons catalog (lab)
CREATE TABLE IF NOT EXISTS tb_reason_version (
    id UUID PRIMARY KEY,
    code VARCHAR(60) NOT NULL,
    version INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    consumer_text TEXT NOT NULL,
    analyst_text TEXT NOT NULL,
    channels TEXT NOT NULL,
    mappings_json TEXT,
    legal_approval VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (code, version)
);
CREATE INDEX IF NOT EXISTS idx_reason_version_status ON tb_reason_version(status);
CREATE INDEX IF NOT EXISTS idx_reason_version_code ON tb_reason_version(code);

INSERT INTO tb_reason_version (id, code, version, status, consumer_text, analyst_text, channels, mappings_json, legal_approval, created_at)
VALUES (
    'b2222222-2222-4222-8222-222222222201',
    'UTILIZATION_HIGH',
    1,
    'APPROVED',
    'O uso recente do limite está elevado em relação à sua capacidade atual.',
    'Utilização de crédito nos últimos 90 dias acima da faixa da política.',
    '["APP","PORTAL","LETTER"]',
    '[{"attribute_code":"UTILIZATION_90D","direction":"NEGATIVE","minimum_magnitude":0.18}]',
    'LEGAL-2026-07-10',
    '2026-07-10T12:00:00Z'
);
