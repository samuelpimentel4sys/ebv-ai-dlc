-- EP-06 F02 — Score thin-file (lab)
CREATE TABLE IF NOT EXISTS tb_thinfile_model_card (
    model_version VARCHAR(40) PRIMARY KEY,
    trained_at TIMESTAMPTZ NOT NULL,
    validated_at TIMESTAMPTZ NOT NULL,
    population_desc TEXT NOT NULL,
    auc NUMERIC(6,4),
    confidence_floor NUMERIC(6,4) NOT NULL,
    limitations_json TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tb_thinfile_score (
    score_id UUID PRIMARY KEY,
    documento_hash VARCHAR(64) NOT NULL,
    model_version VARCHAR(40) NOT NULL,
    score_value INTEGER NOT NULL,
    confidence_band VARCHAR(20) NOT NULL,
    thin_file_flag BOOLEAN NOT NULL DEFAULT TRUE,
    routed_to_traditional BOOLEAN NOT NULL DEFAULT FALSE,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correlation_id UUID NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_tf_score_doc ON tb_thinfile_score (documento_hash, calculated_at DESC);

INSERT INTO tb_thinfile_model_card (model_version, trained_at, validated_at, population_desc, auc, confidence_floor, limitations_json, active)
VALUES ('tf-lab-1.0', NOW(), NOW(), 'thin-file lab population', 0.7200, 0.5500, '{"note":"lab stub"}', TRUE);
