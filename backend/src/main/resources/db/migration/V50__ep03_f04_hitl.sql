-- EP-03 F04 HITL — policy + trail (tb_pj_opinion já criada pelo Alembic Python)
CREATE TABLE IF NOT EXISTS public.tb_pj_approval_policy (
  id UUID PRIMARY KEY,
  min_amount NUMERIC(18,2) NOT NULL,
  max_amount NUMERIC(18,2),
  level_code VARCHAR(40) NOT NULL,
  role_required VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tb_pj_approval_trail (
  id UUID PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.tb_pj_opinion(id),
  action VARCHAR(30) NOT NULL,
  actor_id UUID NOT NULL,
  level_code VARCHAR(40),
  comment TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pj_trail_opinion
  ON public.tb_pj_approval_trail (opinion_id, at);

-- Seed lab L1/L2/L3
INSERT INTO public.tb_pj_approval_policy (id, min_amount, max_amount, level_code, role_required)
VALUES
  ('a1000000-0000-4000-8000-000000000001', 0,            500000.00,   'L1', 'ROLE_APROVADOR_PJ_L1'),
  ('a1000000-0000-4000-8000-000000000002', 500000.01,    5000000.00,  'L2', 'ROLE_APROVADOR_PJ_L2'),
  ('a1000000-0000-4000-8000-000000000003', 5000000.01,   NULL,        'L3', 'ROLE_APROVADOR_PJ_L3')
ON CONFLICT (id) DO NOTHING;
