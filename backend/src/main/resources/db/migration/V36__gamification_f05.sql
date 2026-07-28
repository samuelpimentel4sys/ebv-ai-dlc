-- EP-06 F05 — Gamificação / missões (lab)
CREATE TABLE IF NOT EXISTS tb_mission_catalog (
    mission_id UUID PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    rules_json TEXT NOT NULL,
    reward_type VARCHAR(30) NOT NULL DEFAULT 'SYMBOLIC',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_mission_enrollment (
    enrollment_id UUID PRIMARY KEY,
    mission_id UUID NOT NULL,
    documento_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_mission_achievement (
    achievement_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    mission_id UUID NOT NULL,
    code VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tb_mission_catalog (mission_id, code, title, rules_json, reward_type, active, version, updated_at)
VALUES ('e0000000-0000-4000-8000-000000000001', 'PAY_ON_TIME_3M', 'Pague em dia 3 meses', '{"events":["UTILITY_PAYMENT_ON_TIME"],"target":3}', 'SYMBOLIC', TRUE, 1, NOW());
