-- EP-06 F04 — Consentimento granular (lab)
CREATE TABLE IF NOT EXISTS tb_consent (
    consent_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    purpose_code VARCHAR(40) NOT NULL,
    source_code VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    channel VARCHAR(30) NOT NULL,
    version_termo VARCHAR(20) NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_consent_doc_status ON tb_consent (documento_hash, status);
