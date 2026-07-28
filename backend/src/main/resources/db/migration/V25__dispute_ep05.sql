-- EP-05 Sprint 5 — Contestação core (F05/F02/F01/F08 lab)
CREATE TABLE IF NOT EXISTS tb_dispute (
    id UUID PRIMARY KEY,
    protocol VARCHAR(32) NOT NULL UNIQUE,
    documento VARCHAR(14) NOT NULL,
    status VARCHAR(32) NOT NULL,
    reason_code VARCHAR(64),
    description TEXT,
    channel VARCHAR(32),
    due_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_outcome VARCHAR(40),
    resolution_rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_protocol ON tb_dispute(protocol);
CREATE INDEX IF NOT EXISTS idx_dispute_documento ON tb_dispute(documento);
CREATE INDEX IF NOT EXISTS idx_dispute_due_at ON tb_dispute(due_at);
CREATE INDEX IF NOT EXISTS idx_dispute_status ON tb_dispute(status);

CREATE TABLE IF NOT EXISTS tb_dispute_timeline (
    id BIGSERIAL PRIMARY KEY,
    dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
    event_type VARCHAR(60) NOT NULL,
    message TEXT,
    actor VARCHAR(80),
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispute_timeline_dispute ON tb_dispute_timeline(dispute_id, at);

CREATE TABLE IF NOT EXISTS tb_dispute_attachment (
    id UUID PRIMARY KEY,
    dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    sha256 CHAR(64) NOT NULL,
    storage_uri TEXT NOT NULL,
    prev_attachment_id UUID REFERENCES tb_dispute_attachment(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dispute_attachment_dispute ON tb_dispute_attachment(dispute_id);
