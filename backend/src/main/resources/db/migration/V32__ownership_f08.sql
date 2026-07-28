-- EP-06 F08 — Validação titularidade utilities (lab)
CREATE TABLE IF NOT EXISTS tb_utility_link (
    link_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    partner_code VARCHAR(40) NOT NULL,
    account_ref VARCHAR(80) NOT NULL,
    utility_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unlinked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_util_link_doc ON tb_utility_link (documento_hash, status);
