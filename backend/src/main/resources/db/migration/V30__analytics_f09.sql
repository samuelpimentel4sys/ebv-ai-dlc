-- EP-05 F09 — SAC analytics metrics (lab seed)
CREATE TABLE IF NOT EXISTS tb_sac_metric (
    id UUID PRIMARY KEY,
    metric_key VARCHAR(60) NOT NULL,
    channel VARCHAR(40),
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    metric_value NUMERIC(14,6) NOT NULL,
    meta_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sac_metric_key ON tb_sac_metric(metric_key, period_from, period_to);

INSERT INTO tb_sac_metric (id, metric_key, channel, period_from, period_to, metric_value, meta_json, created_at) VALUES
('d0000000-0000-4000-8000-000000000001', 'DEFLECTION_RATE', 'SELF_SERVICE', '2026-07-01', '2026-07-27', 0.720000, '{"deflectedCases":8640,"totalCases":12000,"reclassified48h":310}', NOW()),
('d0000000-0000-4000-8000-000000000002', 'SAC_COST_AVG', 'PHONE', '2026-07-01', '2026-07-27', 18.500000, '{"currency":"BRL"}', NOW()),
('d0000000-0000-4000-8000-000000000003', 'SAC_COST_AVG', 'CHAT', '2026-07-01', '2026-07-27', 6.200000, '{"currency":"BRL"}', NOW()),
('d0000000-0000-4000-8000-000000000004', 'SAC_COST_AVG', 'SELF_SERVICE', '2026-07-01', '2026-07-27', 0.450000, '{"currency":"BRL"}', NOW()),
('d0000000-0000-4000-8000-000000000005', 'BASELINE_DEFLECTION', NULL, '2025-01-01', '2025-06-30', 0.180000, '{"label":"pre-prisma"}', NOW()),
('d0000000-0000-4000-8000-000000000006', 'BASELINE_SAC_COST', 'PHONE', '2025-01-01', '2025-06-30', 22.000000, '{"currency":"BRL"}', NOW());
