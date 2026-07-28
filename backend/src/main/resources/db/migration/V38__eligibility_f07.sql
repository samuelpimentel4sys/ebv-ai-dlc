-- EP-06 F07 — Marketplace elegibilidade (lab)
CREATE TABLE IF NOT EXISTS tb_mkt_partner (
    partner_id UUID PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    eligibility_json TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_mkt_offer (
    offer_id UUID PRIMARY KEY,
    partner_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    product_type VARCHAR(40) NOT NULL,
    explanation_template VARCHAR(500) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tb_mkt_referral (
    referral_id UUID PRIMARY KEY,
    offer_id UUID NOT NULL,
    documento_hash VARCHAR(64) NOT NULL,
    consent_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    partner_ref VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tb_mkt_partner (partner_id, code, name, eligibility_json, active)
VALUES ('f0000000-0000-4000-8000-000000000001', 'BANK-LAB', 'Banco Lab', '{"minScore":400}', TRUE);
INSERT INTO tb_mkt_offer (offer_id, partner_id, title, product_type, explanation_template, active)
VALUES ('f0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'Conta Inclusão', 'CHECKING', 'Elegível por score thin-file {score}', TRUE);
