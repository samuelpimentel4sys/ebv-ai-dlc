-- EP-02 F07 — Fairness metrics / alerts / runs (lab stub; Fairlearn later)
CREATE TABLE IF NOT EXISTS tb_fairness_run (
    id UUID PRIMARY KEY,
    model_version VARCHAR(80) NOT NULL,
    window_from DATE,
    window_to DATE,
    threshold_profile VARCHAR(60),
    status VARCHAR(20) NOT NULL,
    segments_json TEXT,
    metrics_requested_json TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tb_fairness_metric (
    id UUID PRIMARY KEY,
    run_id UUID REFERENCES tb_fairness_run(id),
    model_version VARCHAR(80) NOT NULL,
    metric_name VARCHAR(60) NOT NULL,
    segment_name VARCHAR(80) NOT NULL,
    group_code VARCHAR(80) NOT NULL,
    metric_value NUMERIC(12,8) NOT NULL,
    approved_limit NUMERIC(12,8) NOT NULL,
    exceeded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_fairness_alert (
    id UUID PRIMARY KEY,
    metric_id UUID REFERENCES tb_fairness_metric(id),
    model_version VARCHAR(80) NOT NULL,
    severity VARCHAR(12) NOT NULL,
    status VARCHAR(20) NOT NULL,
    message TEXT,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fairness_metric_model ON tb_fairness_metric(model_version);
CREATE INDEX IF NOT EXISTS idx_fairness_alert_status ON tb_fairness_alert(status, severity);

-- Seed lab sample
INSERT INTO tb_fairness_run (id, model_version, window_from, window_to, threshold_profile, status, segments_json, metrics_requested_json, submitted_at, finished_at)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'credit-xgb-4.8.2',
    '2026-06-01',
    '2026-06-30',
    'COMMITTEE-2026-02',
    'DONE',
    '["REGION_PROXY"]',
    '["DEMOGRAPHIC_PARITY"]',
    NOW(),
    NOW()
);

INSERT INTO tb_fairness_metric (id, run_id, model_version, metric_name, segment_name, group_code, metric_value, approved_limit, exceeded, created_at)
VALUES (
    'a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'credit-xgb-4.8.2',
    'DEMOGRAPHIC_PARITY',
    'REGION_PROXY',
    'REGION_A',
    0.12000000,
    0.05000000,
    TRUE,
    NOW()
);

INSERT INTO tb_fairness_alert (id, metric_id, model_version, severity, status, message, opened_at)
VALUES (
    'a0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000002',
    'credit-xgb-4.8.2',
    'HIGH',
    'OPEN',
    'Lab seed: demographic parity exceeded approved limit',
    NOW()
);
