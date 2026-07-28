-- EP-05 F07 — API credentials lifecycle (lab; store hash only)
CREATE TABLE IF NOT EXISTS tb_api_credential (
    id UUID PRIMARY KEY,
    client_id VARCHAR(80) NOT NULL UNIQUE,
    secret_hash VARCHAR(128) NOT NULL,
    scopes TEXT NOT NULL,
    env VARCHAR(16) NOT NULL,
    status VARCHAR(20) NOT NULL,
    rate_limit INT NOT NULL DEFAULT 1000,
    tenant_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_credential_tenant ON tb_api_credential(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_credential_status ON tb_api_credential(status);
