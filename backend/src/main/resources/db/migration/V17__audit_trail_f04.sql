-- EP-02 F04 — Audit trail WORM index (lab FS)
CREATE TABLE IF NOT EXISTS tb_audit_event (
    id UUID PRIMARY KEY,
    documento VARCHAR(64),
    actor_id VARCHAR(120),
    event_type VARCHAR(60) NOT NULL,
    payload_json TEXT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    prev_sha256 VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_event_documento ON tb_audit_event(documento);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON tb_audit_event(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_event_created ON tb_audit_event(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_event_actor ON tb_audit_event(actor_id);

CREATE TABLE IF NOT EXISTS tb_audit_export (
    id UUID PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    format VARCHAR(8) NOT NULL,
    purpose VARCHAR(120) NOT NULL,
    manifest_hash VARCHAR(128) NOT NULL,
    retention_until DATE NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filters_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_export_status ON tb_audit_export(status);
