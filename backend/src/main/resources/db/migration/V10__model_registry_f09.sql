-- F09 Model Registry
CREATE TABLE IF NOT EXISTS tb_model_version (
    model_id VARCHAR(80) NOT NULL,
    version VARCHAR(40) NOT NULL,
    stage VARCHAR(20) NOT NULL,
    artifact_uri TEXT NOT NULL,
    metrics_json TEXT,
    immutable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (model_id, version)
);

CREATE TABLE IF NOT EXISTS tb_model_promotion (
    id UUID PRIMARY KEY,
    model_id VARCHAR(80) NOT NULL,
    version VARCHAR(40) NOT NULL,
    from_stage VARCHAR(20) NOT NULL,
    to_stage VARCHAR(20) NOT NULL,
    approvers TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tb_model_version (model_id, version, stage, artifact_uri, metrics_json, immutable) VALUES
    ('score-vivo', '3.1.0', 'PRODUCTION', 's3://prisma-models/score-vivo/3.1.0/model.onnx', '{"auc":0.81}', TRUE),
    ('score-vivo', '3.2.1', 'CANARY', 's3://prisma-models/score-vivo/3.2.1/model.onnx', '{"auc":0.84,"canaryOk":true}', TRUE)
ON CONFLICT (model_id, version) DO NOTHING;
