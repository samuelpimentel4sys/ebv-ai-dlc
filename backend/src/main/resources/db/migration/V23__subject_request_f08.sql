-- EP-02 F08 — Subject rights requests LGPD Art.18 (lab stub)
CREATE TABLE IF NOT EXISTS tb_subject_request (
    id UUID PRIMARY KEY,
    right_type VARCHAR(32) NOT NULL,
    subject_token VARCHAR(128) NOT NULL,
    channel VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(24) NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    response_summary TEXT,
    attachment_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subject_request_status_due ON tb_subject_request(status, due_at);
CREATE INDEX IF NOT EXISTS idx_subject_request_right_type ON tb_subject_request(right_type);
