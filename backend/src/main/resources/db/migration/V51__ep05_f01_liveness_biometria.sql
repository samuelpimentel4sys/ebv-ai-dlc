-- EP-05 F01 BIO — Liveness / consentimento biométrico (Noah)
-- Fonte: EP05-F01-US-BE-01 Orquestração Sessão Liveness Rekognition

CREATE OR REPLACE FUNCTION fn_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS tb_biometric_consent (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL,
    term_version    VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMPTZ NULL,
    ip_address      VARCHAR(45) NULL,
    user_agent      VARCHAR(255) NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_biometric_consent_customer_version UNIQUE (customer_id, term_version),
    CONSTRAINT chk_biometric_consent_status CHECK (status IN ('ACTIVE', 'REVOKED'))
);

DROP TRIGGER IF EXISTS trg_biometric_consent_updated_at ON tb_biometric_consent;
CREATE TRIGGER trg_biometric_consent_updated_at
    BEFORE UPDATE ON tb_biometric_consent
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_biometric_consent_customer_status
    ON tb_biometric_consent (customer_id, status);

CREATE TABLE IF NOT EXISTS tb_liveness_session (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      VARCHAR(100) NOT NULL,
    customer_id     UUID NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    liveness_score  NUMERIC(5, 2) NULL,
    far_rate        NUMERIC(8, 6) NULL,
    device_id       VARCHAR(100) NULL,
    channel         VARCHAR(30) NOT NULL DEFAULT 'MOBILE_APP',
    ip_address      VARCHAR(45) NULL,
    app_version     VARCHAR(20) NULL,
    platform        VARCHAR(30) NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_liveness_session_session_id UNIQUE (session_id),
    CONSTRAINT chk_liveness_session_status CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED'))
);

DROP TRIGGER IF EXISTS trg_liveness_session_updated_at ON tb_liveness_session;
CREATE TRIGGER trg_liveness_session_updated_at
    BEFORE UPDATE ON tb_liveness_session
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_liveness_session_customer_status
    ON tb_liveness_session (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_liveness_session_created_at
    ON tb_liveness_session (created_at);

CREATE TABLE IF NOT EXISTS tb_biometric_attempt (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL,
    session_id      VARCHAR(100) NULL,
    attempt_result  VARCHAR(20) NOT NULL,
    score           NUMERIC(5, 2) NULL,
    is_spoofing     BOOLEAN NOT NULL DEFAULT FALSE,
    device_id       VARCHAR(100) NULL,
    ip_address      VARCHAR(45) NULL,
    failure_reason  VARCHAR(255) NULL,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_biometric_attempt_result CHECK (attempt_result IN ('SUCCESS', 'FAILED_SCORE', 'SPOOFING_SUSPECTED', 'ERROR'))
);

CREATE INDEX IF NOT EXISTS idx_biometric_attempt_customer_time
    ON tb_biometric_attempt (customer_id, attempted_at);

CREATE TABLE IF NOT EXISTS tb_biometric_lockout (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id           UUID NOT NULL,
    device_id             VARCHAR(100) NULL,
    reason                VARCHAR(50) NOT NULL,
    failed_attempts_count INT NOT NULL DEFAULT 3,
    locked_at             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until          TIMESTAMPTZ NOT NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_biometric_lockout_reason CHECK (reason IN ('EXCEEDED_ATTEMPTS', 'SPOOFING_DETECTED', 'MANUAL_BLOCK')),
    CONSTRAINT chk_biometric_lockout_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'UNLOCKED_MANUALLY'))
);

DROP TRIGGER IF EXISTS trg_biometric_lockout_updated_at ON tb_biometric_lockout;
CREATE TRIGGER trg_biometric_lockout_updated_at
    BEFORE UPDATE ON tb_biometric_lockout
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_biometric_lockout_customer_status
    ON tb_biometric_lockout (customer_id, status, locked_until);

CREATE TABLE IF NOT EXISTS tb_spoofing_audit_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id      UUID NOT NULL,
    session_id       VARCHAR(100) NOT NULL,
    detection_type   VARCHAR(50) NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    s3_audit_path    VARCHAR(255) NULL,
    device_id        VARCHAR(100) NULL,
    ip_address       VARCHAR(45) NULL,
    metadata_json    JSONB NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_spoofing_detection_type CHECK (detection_type IN (
        '3D_MASK', 'PRINTED_PHOTO', 'DEEPFAKE_VIDEO', 'REPLAY_ATTACK', 'GENERIC_SPOOF'))
);

CREATE INDEX IF NOT EXISTS idx_spoofing_audit_customer ON tb_spoofing_audit_log (customer_id);
CREATE INDEX IF NOT EXISTS idx_spoofing_audit_created_at ON tb_spoofing_audit_log (created_at);
