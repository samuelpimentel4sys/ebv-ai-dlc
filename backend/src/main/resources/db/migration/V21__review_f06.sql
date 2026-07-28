-- EP-02 F06 — Human review queue (lab stub)
CREATE TABLE IF NOT EXISTS tb_review (
    id UUID PRIMARY KEY,
    decision_id UUID NOT NULL,
    subject_token VARCHAR(128) NOT NULL,
    reason TEXT NOT NULL,
    channel VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL,
    assignee VARCHAR(128),
    due_at TIMESTAMPTZ NOT NULL,
    outcome VARCHAR(20),
    rationale TEXT,
    reviewed_factors_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_review_status_due ON tb_review(status, due_at);
CREATE INDEX IF NOT EXISTS idx_review_decision ON tb_review(decision_id);
CREATE INDEX IF NOT EXISTS idx_review_assignee ON tb_review(assignee);
