-- EP-05 F06 — SLA policies + escalations (lab)
CREATE TABLE IF NOT EXISTS tb_sla_policy (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    escalate_at_pct INT NOT NULL,
    notify_channels TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sla_policy_active
    ON tb_sla_policy ((status))
    WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS tb_sla_escalation (
    id UUID PRIMARY KEY,
    dispute_id UUID NOT NULL REFERENCES tb_dispute(id),
    level INT NOT NULL,
    notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sla_escalation_dispute ON tb_sla_escalation(dispute_id, notified_at DESC);

INSERT INTO tb_sla_policy (id, name, escalate_at_pct, notify_channels, status, created_at)
VALUES (
    'b0000000-0000-4000-8000-000000000001',
    'Default 80pct supervisor',
    80,
    '["EMAIL","SLACK"]',
    'DRAFT',
    NOW()
);
