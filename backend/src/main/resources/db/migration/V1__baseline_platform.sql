-- EBV Prisma — caminho quente DBA V2: TITULAR → SCORE_MATERIALIZADO → DECISAO
-- Espelho Supabase migration: baseline_hot_path (projeto Prisma Equifax)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS titular (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento       VARCHAR(14) NOT NULL,
    tipo_documento  VARCHAR(4)  NOT NULL CHECK (tipo_documento IN ('CPF', 'CNPJ')),
    nome            VARCHAR(255),
    status          VARCHAR(32) NOT NULL DEFAULT 'ATIVO',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_titular_documento UNIQUE (documento)
);

CREATE TABLE IF NOT EXISTS score_materializado (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titular_id      UUID NOT NULL REFERENCES titular (id),
    valor           INTEGER NOT NULL CHECK (valor BETWEEN 0 AND 1000),
    modelo_versao   VARCHAR(64) NOT NULL,
    calculado_em    TIMESTAMPTZ NOT NULL,
    event_id        VARCHAR(128),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_score_titular_calc
    ON score_materializado (titular_id, calculado_em DESC);

CREATE TABLE IF NOT EXISTS decisao (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titular_id      UUID NOT NULL REFERENCES titular (id),
    score_id        UUID REFERENCES score_materializado (id),
    resultado       VARCHAR(32) NOT NULL,
    politica_versao VARCHAR(64) NOT NULL,
    modelo_versao   VARCHAR(64) NOT NULL,
    latencia_ms     INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_decisao_titular
    ON decisao (titular_id, created_at DESC);
