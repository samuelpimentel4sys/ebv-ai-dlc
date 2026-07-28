-- EP-05 F03 — Onboarding PME (lab)
CREATE TABLE IF NOT EXISTS tb_onboarding (
    id UUID PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    representative VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    tenant_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onboarding_cnpj ON tb_onboarding(cnpj);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON tb_onboarding(status);
