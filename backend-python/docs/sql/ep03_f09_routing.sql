-- EP-03 F09 — routing + telemetria custo
CREATE TABLE IF NOT EXISTS public.tb_pj_routing_policy (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rules_json JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pj_routing_policy_active
  ON public.tb_pj_routing_policy (active, version DESC);

CREATE TABLE IF NOT EXISTS public.tb_pj_routing_decision (
  id UUID PRIMARY KEY,
  task_type VARCHAR(40) NOT NULL,
  model_chosen VARCHAR(80) NOT NULL,
  reason VARCHAR(200) NOT NULL,
  opinion_id UUID,
  promoted BOOLEAN NOT NULL DEFAULT FALSE,
  model_class VARCHAR(20),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pj_routing_decision_at
  ON public.tb_pj_routing_decision (at DESC);

CREATE TABLE IF NOT EXISTS public.tb_pj_inference_cost (
  id UUID PRIMARY KEY,
  model VARCHAR(80) NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  usd NUMERIC(12,6) NOT NULL,
  task_type VARCHAR(40),
  provider VARCHAR(20),
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pj_cost_at ON public.tb_pj_inference_cost (at);
