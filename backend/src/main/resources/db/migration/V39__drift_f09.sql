-- EP-06 F09 — Monitoramento thin-file / drift (lab)
CREATE TABLE IF NOT EXISTS tb_tf_monitoring_run (
    run_id UUID PRIMARY KEY,
    model_version VARCHAR(40) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL,
    auc_current NUMERIC(6,4),
    auc_baseline NUMERIC(6,4),
    degradation_pct NUMERIC(7,4)
);

CREATE TABLE IF NOT EXISTS tb_tf_drift_metric (
    metric_id UUID PRIMARY KEY,
    run_id UUID NOT NULL,
    feature_name VARCHAR(80) NOT NULL,
    psi NUMERIC(8,4) NOT NULL,
    vulnerable_segment BOOLEAN NOT NULL DEFAULT FALSE,
    severity VARCHAR(20) NOT NULL
);
