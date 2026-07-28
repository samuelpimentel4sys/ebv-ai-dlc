-- EP-04 F03 — Motor estresse agregados (lab stub)
CREATE TABLE IF NOT EXISTS tb_pf_stress_scenario (
    scenario_id UUID PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    kind VARCHAR(20) NOT NULL,
    label VARCHAR(120) NOT NULL,
    variables_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tb_pf_stress_run (
    run_id VARCHAR(40) PRIMARY KEY,
    portfolio_id UUID NOT NULL,
    scenario_id UUID,
    status VARCHAR(20) NOT NULL,
    variables_json TEXT,
    result_json TEXT,
    aggregate_version VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

INSERT INTO tb_pf_stress_scenario (scenario_id, code, kind, label, variables_json)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'BASELINE', 'PRESET', 'Baseline macro', '{"selic":10.5,"unemployment":7.5,"inflation":4.5,"fxUsdBrl":5.2}'),
  ('a0000000-0000-4000-8000-000000000002', 'CRISIS_MILD', 'PRESET', 'Crise leve', '{"selic":15.75,"unemployment":9.2,"inflation":6.1,"fxUsdBrl":5.85}')
ON CONFLICT (code) DO NOTHING;
