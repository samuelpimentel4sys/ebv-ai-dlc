-- EP-05 F04 — Console B2B usage / invoices / contracts (lab seed)
CREATE TABLE IF NOT EXISTS tb_console_usage (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    product_code VARCHAR(80) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    call_count BIGINT NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    freshness_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_console_invoice (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    invoice_number VARCHAR(40) NOT NULL,
    period_label VARCHAR(40) NOT NULL,
    amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_console_contract (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    contract_code VARCHAR(80) NOT NULL,
    version VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_console_usage_tenant ON tb_console_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_console_invoice_tenant ON tb_console_invoice(tenant_id);
CREATE INDEX IF NOT EXISTS idx_console_contract_tenant ON tb_console_contract(tenant_id);

INSERT INTO tb_console_usage (id, tenant_id, product_code, environment, call_count, amount, currency, period_start, period_end, freshness_at)
VALUES (
    'c0000000-0000-4000-8000-000000000001',
    'demo-tenant',
    'credit.score',
    'PRODUCTION',
    12840,
    3842.00,
    'BRL',
    '2026-07-01',
    '2026-07-31',
    NOW()
);

INSERT INTO tb_console_invoice (id, tenant_id, invoice_number, period_label, amount, currency, status, issued_at)
VALUES (
    'c0000000-0000-4000-8000-000000000002',
    'demo-tenant',
    'INV-2026-07-001',
    '2026-07',
    3842.00,
    'BRL',
    'OPEN',
    NOW()
);

INSERT INTO tb_console_contract (id, tenant_id, contract_code, version, status, accepted_at)
VALUES (
    'c0000000-0000-4000-8000-000000000003',
    'demo-tenant',
    'API-CREDITO',
    'API-CREDITO-2026.07',
    'ACTIVE',
    NOW()
);
