-- Massa lab Prisma — demo FE (local Docker)
-- Pessoas: 12345678901 (Marina), 98765432100 (Carlos), 11144477735 (Ana)
-- Portfolio FE: aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee

BEGIN;

-- ========== Score ==========
INSERT INTO tb_score_current (documento, score, model_version, updated_at, last_event_id) VALUES
  ('12345678901', 712.00, '3.1.0', NOW() - INTERVAL '2 hours', 'b1000000-0000-4000-8000-000000000001'),
  ('98765432100', 548.50, '3.1.0', NOW() - INTERVAL '1 day',   'b1000000-0000-4000-8000-000000000002'),
  ('11144477735', 801.00, '3.1.0', NOW() - INTERVAL '30 minutes','b1000000-0000-4000-8000-000000000003')
ON CONFLICT (documento) DO UPDATE SET
  score = EXCLUDED.score,
  model_version = EXCLUDED.model_version,
  updated_at = EXCLUDED.updated_at,
  last_event_id = EXCLUDED.last_event_id;

DELETE FROM tb_score_history WHERE documento IN ('12345678901','98765432100','11144477735');
INSERT INTO tb_score_history (documento, score, model_version, reason, at) VALUES
  ('12345678901', 680.00, '3.1.0', 'INGEST_BATCH', NOW() - INTERVAL '30 days'),
  ('12345678901', 695.00, '3.1.0', 'FEATURE_REFRESH', NOW() - INTERVAL '14 days'),
  ('12345678901', 712.00, '3.1.0', 'MANUAL_RECALC', NOW() - INTERVAL '2 hours'),
  ('98765432100', 520.00, '3.1.0', 'INGEST_BATCH', NOW() - INTERVAL '45 days'),
  ('98765432100', 548.50, '3.1.0', 'NEGATIVACAO', NOW() - INTERVAL '1 day'),
  ('11144477735', 790.00, '3.1.0', 'INGEST_BATCH', NOW() - INTERVAL '20 days'),
  ('11144477735', 801.00, '3.1.0', 'UTILITY_PAYMENT', NOW() - INTERVAL '30 minutes');

-- ========== Features online ==========
INSERT INTO tb_feature_online (documento, feature_name, value_json, event_ts, written_at) VALUES
  ('12345678901', 'divida_aberta', '1500.00', NOW() - INTERVAL '1 day', NOW()),
  ('12345678901', 'qtd_negativacoes_12m', '2', NOW() - INTERVAL '1 day', NOW()),
  ('98765432100', 'divida_aberta', '8200.00', NOW() - INTERVAL '2 days', NOW()),
  ('98765432100', 'qtd_negativacoes_12m', '5', NOW() - INTERVAL '2 days', NOW()),
  ('11144477735', 'divida_aberta', '0', NOW() - INTERVAL '3 hours', NOW()),
  ('11144477735', 'qtd_negativacoes_12m', '0', NOW() - INTERVAL '3 hours', NOW())
ON CONFLICT (documento, feature_name, event_ts) DO NOTHING;

-- ========== Identity (golden + candidate merge) ==========
INSERT INTO tb_golden_record (gr_id, canonical_documento, version, status, updated_at) VALUES
  ('c1000000-0000-4000-8000-000000000001', '12345678901', 1, 'ACTIVE', NOW()),
  ('c1000000-0000-4000-8000-000000000002', '12345678901', 2, 'CANDIDATE', NOW()),
  ('c1000000-0000-4000-8000-000000000003', '98765432100', 1, 'ACTIVE', NOW()),
  ('c1000000-0000-4000-8000-000000000004', '11144477735', 1, 'ACTIVE', NOW())
ON CONFLICT (gr_id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

INSERT INTO tb_identity_candidate (id, left_gr, right_gr, confidence, status, created_at) VALUES
  ('c2000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000002',
   0.9100, 'PENDING', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO UPDATE SET confidence = EXCLUDED.confidence, status = EXCLUDED.status;

-- ========== Decisions + explanation ==========
INSERT INTO tb_decision (
  decision_id, documento, score, model_version, outcome, sha256, prev_sha256,
  storage_uri, created_at, latency_ms, degraded_flags, client_id, partial, product_code, explanation_ref
) VALUES
  ('d1000000-0000-4000-8000-000000000001', '12345678901', 712.00, '3.1.0', 'APPROVE',
   'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', NULL,
   'fs://lab/decisions/d1000000-0000-4000-8000-000000000001.json', NOW() - INTERVAL '2 hours',
   42, ARRAY[]::text[], 'demo-b2b', false, 'SCORE_VIVO', 'lab-explain-1'),
  ('d1000000-0000-4000-8000-000000000002', '98765432100', 548.50, '3.1.0', 'REVIEW',
   'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   'fs://lab/decisions/d1000000-0000-4000-8000-000000000002.json', NOW() - INTERVAL '1 day',
   55, ARRAY['PARTIAL_FEATURES']::text[], 'demo-b2b', true, 'SCORE_VIVO', 'lab-explain-2'),
  ('d1000000-0000-4000-8000-000000000003', '11144477735', 801.00, '3.1.0', 'APPROVE',
   'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
   'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'fs://lab/decisions/d1000000-0000-4000-8000-000000000003.json', NOW() - INTERVAL '30 minutes',
   31, ARRAY[]::text[], 'demo-b2b', false, 'SCORE_VIVO', 'lab-explain-3')
ON CONFLICT (decision_id) DO UPDATE SET
  score = EXCLUDED.score, outcome = EXCLUDED.outcome, created_at = EXCLUDED.created_at;

INSERT INTO tb_explanation (decision_id, base_value, factors_json, model_version, immutable, created_at) VALUES
  ('d1000000-0000-4000-8000-000000000001', 650.000000,
   '[{"attribute_code":"divida_aberta","value":1,"shap_value":-18.200000,"direction":"NEGATIVE","label":"Dívida em aberto"},{"attribute_code":"qtd_negativacoes","value":2,"shap_value":-12.500000,"direction":"NEGATIVE","label":"Quantidade de negativações"},{"attribute_code":"baseline","value":650,"shap_value":42.700000,"direction":"POSITIVE","label":"Baseline do modelo"}]',
   '3.1.0', true, NOW() - INTERVAL '2 hours'),
  ('d1000000-0000-4000-8000-000000000002', 600.000000,
   '[{"attribute_code":"divida_aberta","value":3,"shap_value":-85.000000,"direction":"NEGATIVE","label":"Dívida em aberto"},{"attribute_code":"qtd_negativacoes","value":4,"shap_value":-40.000000,"direction":"NEGATIVE","label":"Quantidade de negativações"},{"attribute_code":"baseline","value":600,"shap_value":73.500000,"direction":"POSITIVE","label":"Baseline do modelo"}]',
   '3.1.0', true, NOW() - INTERVAL '1 day'),
  ('d1000000-0000-4000-8000-000000000003', 700.000000,
   '[{"attribute_code":"divida_aberta","value":0,"shap_value":20.000000,"direction":"POSITIVE","label":"Dívida em aberto"},{"attribute_code":"qtd_negativacoes","value":0,"shap_value":15.000000,"direction":"POSITIVE","label":"Quantidade de negativações"},{"attribute_code":"baseline","value":700,"shap_value":66.000000,"direction":"POSITIVE","label":"Baseline do modelo"}]',
   '3.1.0', true, NOW() - INTERVAL '30 minutes')
ON CONFLICT (decision_id) DO UPDATE SET factors_json = EXCLUDED.factors_json;

-- ========== Contestações ==========
INSERT INTO tb_dispute (
  id, protocol, documento, status, reason_code, description, channel, due_at, created_at
) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'DSP-2026-0001001', '12345678901', 'OPEN',
   'NAO_RECONHECO_DIVIDA', 'Não reconheço a negativação da Credor Lab SA.', 'SELF_SERVICE',
   NOW() + INTERVAL '5 days', NOW() - INTERVAL '6 hours'),
  ('e1000000-0000-4000-8000-000000000002', 'DSP-2026-0001002', '98765432100', 'IN_DILIGENCE',
   'VALOR_INCORRETO', 'Valor cobrado diverge do contrato.', 'PORTAL_B2C',
   NOW() + INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('e1000000-0000-4000-8000-000000000003', 'DSP-2026-0001003', '11144477735', 'RESOLVED',
   'JA_PAGO', 'Comprovante de quitação anexado.', 'SELF_SERVICE',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, description = EXCLUDED.description;

UPDATE tb_dispute SET
  resolved_at = NOW() - INTERVAL '1 day',
  resolution_outcome = 'PROCEDENTE',
  resolution_rationale = 'Comprovante validado — apontamento baixado.'
WHERE id = 'e1000000-0000-4000-8000-000000000003';

DELETE FROM tb_dispute_timeline WHERE dispute_id IN (
  'e1000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003'
);
INSERT INTO tb_dispute_timeline (dispute_id, event_type, message, actor, at) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'CREATED', 'Protocolo aberto via self-service', 'titular', NOW() - INTERVAL '6 hours'),
  ('e1000000-0000-4000-8000-000000000001', 'SLA_STARTED', 'SLA de 5 dias úteis iniciado', 'system', NOW() - INTERVAL '6 hours'),
  ('e1000000-0000-4000-8000-000000000002', 'CREATED', 'Protocolo aberto', 'titular', NOW() - INTERVAL '2 days'),
  ('e1000000-0000-4000-8000-000000000002', 'ASSIGNED', 'Atribuído ao analista lab', 'ops', NOW() - INTERVAL '1 day'),
  ('e1000000-0000-4000-8000-000000000003', 'CREATED', 'Protocolo aberto', 'titular', NOW() - INTERVAL '10 days'),
  ('e1000000-0000-4000-8000-000000000003', 'RESOLVED', 'Procedente — apontamento removido', 'analista', NOW() - INTERVAL '1 day');

-- ========== Consent (sha256 do documento UTF-8) ==========
-- 12345678901 -> 254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4
INSERT INTO tb_consent (
  consent_id, documento_hash, purpose_code, source_code, status,
  granted_at, revoked_at, valid_to, channel, version_termo
) VALUES
  ('f1000000-0000-4000-8000-000000000001',
   '254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4',
   'CREDIT_SCORE', 'ALT_DATA_UTILITY', 'ACTIVE',
   NOW() - INTERVAL '20 days', NULL, NOW() + INTERVAL '345 days', 'APP_B2C', 'v1.0'),
  ('f1000000-0000-4000-8000-000000000002',
   '254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4',
   'BIOMETRY', 'LIVENESS', 'ACTIVE',
   NOW() - INTERVAL '5 days', NULL, NOW() + INTERVAL '360 days', 'APP_B2C', 'v1.0'),
  ('f1000000-0000-4000-8000-000000000003',
   'fe63757c49af2f9466851ad0b5cd915a5097ab13354c15e42114958b7173521d',
   'CREDIT_SCORE', 'ALT_DATA_UTILITY', 'ACTIVE',
   NOW() - INTERVAL '10 days', NULL, NOW() + INTERVAL '355 days', 'APP_B2C', 'v1.0')
ON CONFLICT (consent_id) DO UPDATE SET status = EXCLUDED.status;

-- ========== Thin-file ==========
INSERT INTO tb_thinfile_score (
  score_id, documento_hash, model_version, score_value, confidence_band,
  thin_file_flag, routed_to_traditional, calculated_at, correlation_id
) VALUES
  ('a3000000-0000-4000-8000-000000000001',
   '254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4',
   'tf-1.0.0', 640, 'MEDIUM', true, false, NOW() - INTERVAL '1 day',
   'a3000000-0000-4000-8000-000000000011'),
  ('a3000000-0000-4000-8000-000000000002',
   '8c2d3a751f9c73934441d16f9578d566e7dd7a2996a042f2ef047b5be926534c',
   'tf-1.0.0', 720, 'HIGH', false, true, NOW() - INTERVAL '2 hours',
   'a3000000-0000-4000-8000-000000000012')
ON CONFLICT (score_id) DO UPDATE SET score_value = EXCLUDED.score_value;

-- ========== Coach ==========
INSERT INTO tb_coach_journey (journey_id, documento_hash, status, started_at, decision_snapshot_id, updated_at) VALUES
  ('a4000000-0000-4000-8000-000000000001',
   '254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4',
   'ACTIVE', NOW() - INTERVAL '7 days',
   'd1000000-0000-4000-8000-000000000001', NOW())
ON CONFLICT (journey_id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at;

INSERT INTO tb_coach_goal (goal_id, journey_id, goal_type, title, estimate_text, guarantees_approval, status, created_at) VALUES
  ('a4000000-0000-4000-8000-000000000011',
   'a4000000-0000-4000-8000-000000000001',
   'PAY_ON_TIME', 'Pague 3 contas em dia', 'Estimativa +25 pts em 90 dias', false, 'OPEN', NOW() - INTERVAL '7 days'),
  ('a4000000-0000-4000-8000-000000000012',
   'a4000000-0000-4000-8000-000000000001',
   'REDUCE_DEBT', 'Reduza dívida aberta abaixo de R$ 500', 'Estimativa +40 pts', false, 'OPEN', NOW() - INTERVAL '7 days')
ON CONFLICT (goal_id) DO UPDATE SET status = EXCLUDED.status;

-- ========== Onboarding B2B ==========
INSERT INTO tb_onboarding (id, cnpj, legal_name, representative, status, tenant_id, created_at, completed_at) VALUES
  ('a5000000-0000-4000-8000-000000000001', '11222333000181', 'Credor Lab SA', 'Marina Souza',
   'COMPLETED', 'demo-tenant', NOW() - INTERVAL '40 days', NOW() - INTERVAL '38 days'),
  ('a5000000-0000-4000-8000-000000000002', '44555666000199', 'Financeira Demo LTDA', 'Carlos Lima',
   'IN_PROGRESS', 'demo-tenant', NOW() - INTERVAL '3 days', NULL)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- ========== Portfolio (LAB_PORTFOLIO_ID do FE) ==========
INSERT INTO tb_pf_snapshot (snapshot_id, portfolio_id, as_of_date, aggregate_version, summary_json, node_count, divergence_flag) VALUES
  ('a6000000-0000-4000-8000-000000000001', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', CURRENT_DATE - 7,
   'agg-lab-1', '{"exposure":12500000,"npl":0.042,"concentrationTop10":0.31,"avgScore":690}', 1280, false),
  ('a6000000-0000-4000-8000-000000000002', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', CURRENT_DATE,
   'agg-lab-2', '{"exposure":13150000,"npl":0.038,"concentrationTop10":0.29,"avgScore":702}', 1342, false)
ON CONFLICT (snapshot_id) DO UPDATE SET summary_json = EXCLUDED.summary_json, node_count = EXCLUDED.node_count;

INSERT INTO tb_pf_alert (alert_id, portfolio_id, dimension, dim_key, severity, status, message, created_at) VALUES
  ('a6000000-0000-4000-8000-000000000011', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
   'SECTOR', 'VAREJO', 'WARN', 'OPEN', 'Concentração varejo acima do warn (28%)', NOW() - INTERVAL '4 hours'),
  ('a6000000-0000-4000-8000-000000000012', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
   'REGION', 'Norte', 'INFO', 'OPEN', 'Crescimento de exposição no Norte +12% MoM', NOW() - INTERVAL '1 day')
ON CONFLICT (alert_id) DO UPDATE SET message = EXCLUDED.message, status = EXCLUDED.status;

INSERT INTO tb_pf_timeline_event (event_id, portfolio_id, event_at, event_type, impact_json, label) VALUES
  ('a6000000-0000-4000-8000-000000000021', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
   NOW() - INTERVAL '7 days', 'SNAPSHOT', '{"deltaExposure":0}', 'Snapshot semanal'),
  ('a6000000-0000-4000-8000-000000000022', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
   NOW() - INTERVAL '2 days', 'STRESS', '{"scenario":"CRISIS_MILD"}', 'Stress crise leve executado'),
  ('a6000000-0000-4000-8000-000000000023', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
   NOW() - INTERVAL '4 hours', 'ALERT', '{"severity":"WARN"}', 'Alerta concentração varejo')
ON CONFLICT (event_id) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO tb_pf_limit (limit_id, portfolio_id, dimension, threshold_pct, warn_pct, updated_at) VALUES
  ('a6000000-0000-4000-8000-000000000031', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'SECTOR', 35.0000, 25.0000, NOW()),
  ('a6000000-0000-4000-8000-000000000032', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'REGION', 40.0000, 30.0000, NOW())
ON CONFLICT (limit_id) DO UPDATE SET threshold_pct = EXCLUDED.threshold_pct, warn_pct = EXCLUDED.warn_pct;

-- ========== PJ opinion (HITL) ==========
INSERT INTO tb_pj_opinion (
  id, cnpj, status, model_route, started_at, completed_at, elapsed_ms, created_by, operation_amount, currency
) VALUES
  ('a7000000-0000-4000-8000-000000000001', '11222333000181', 'PENDING_APPROVAL', 'lab-stub',
   NOW() - INTERVAL '3 hours', NULL, NULL,
   'a7000000-0000-4000-8000-000000000099', 750000.00, 'BRL'),
  ('a7000000-0000-4000-8000-000000000002', '44555666000199', 'DRAFT', 'lab-stub',
   NOW() - INTERVAL '1 day', NULL, NULL,
   'a7000000-0000-4000-8000-000000000099', 120000.00, 'BRL')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, operation_amount = EXCLUDED.operation_amount;

INSERT INTO tb_pj_approval_trail (id, opinion_id, action, actor_id, level_code, comment, at) VALUES
  ('a7000000-0000-4000-8000-000000000011', 'a7000000-0000-4000-8000-000000000001',
   'SUBMIT', 'a7000000-0000-4000-8000-000000000099', 'L2', 'Parecer enviado para L2', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- ========== EP-02 queues (operator platform / steward) ==========
-- assignee/actor = username Keycloak lab (platform). sub KC muda a cada realm recreate.
INSERT INTO tb_review (
  id, decision_id, subject_token, reason, channel, status, assignee, due_at,
  outcome, rationale, reviewed_factors_json, created_at, decided_at
) VALUES
  ('b2000000-0000-4000-8000-000000000001',
   'd1000000-0000-4000-8000-000000000002',
   '98765432100', 'Score em REVIEW — validar negativação', 'PORTAL_B2C', 'OPEN', 'platform',
   NOW() + INTERVAL '2 days', NULL, NULL,
   '[{"feature":"divida_aberta","impact":-85.0}]',
   NOW() - INTERVAL '1 day', NULL),
  ('b2000000-0000-4000-8000-000000000002',
   'd1000000-0000-4000-8000-000000000001',
   '12345678901', 'Pedido de revisão humana pós-contestação', 'SELF_SERVICE', 'IN_REVIEW', 'platform',
   NOW() + INTERVAL '1 day', NULL, NULL, NULL,
   NOW() - INTERVAL '4 hours', NULL),
  ('b2000000-0000-4000-8000-000000000003',
   'd1000000-0000-4000-8000-000000000003',
   '11144477735', 'Revisão concluída — manter APPROVE', 'OPS', 'DECIDED', 'platform',
   NOW() - INTERVAL '1 day', 'MAINTAIN', 'Fatores coerentes com thin-file positivo',
   '[{"feature":"utility_on_time","impact":66.0}]',
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status, assignee = EXCLUDED.assignee, due_at = EXCLUDED.due_at;

INSERT INTO tb_subject_request (
  id, right_type, subject_token, channel, description, status, due_at,
  response_summary, attachment_id, created_at, updated_at
) VALUES
  ('b3000000-0000-4000-8000-000000000001',
   'ACCESS', '12345678901', 'SELF_SERVICE',
   'Quero cópia dos dados usados no score 712.', 'OPEN',
   NOW() + INTERVAL '10 days', NULL, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('b3000000-0000-4000-8000-000000000002',
   'RECTIFICATION', '98765432100', 'PORTAL_B2C',
   'Corrigir valor de dívida aberta (apontamento duplicado).', 'IN_PROGRESS',
   NOW() + INTERVAL '5 days', 'Em análise pelo operador platform', NULL,
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours'),
  ('b3000000-0000-4000-8000-000000000003',
   'ERASURE', '11144477735', 'SELF_SERVICE',
   'Solicito exclusão de dados de marketing (manter crédito).', 'DONE',
   NOW() - INTERVAL '2 days', 'Atendido parcialmente — finalidade crédito preservada.', NULL,
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status, description = EXCLUDED.description, updated_at = EXCLUDED.updated_at;

INSERT INTO tb_audit_event (
  id, documento, actor_id, event_type, payload_json, sha256, prev_sha256, created_at
) VALUES
  ('b4000000-0000-4000-8000-000000000001',
   '12345678901', 'platform', 'SCORE_RECALC',
   '{"score":712,"model":"3.1.0","actor":"platform"}',
   '1111111111111111111111111111111111111111111111111111111111111111', NULL,
   NOW() - INTERVAL '2 hours'),
  ('b4000000-0000-4000-8000-000000000002',
   '98765432100', 'platform', 'DISPUTE_ASSIGN',
   '{"protocol":"DSP-2026-0001002","assignee":"platform"}',
   '2222222222222222222222222222222222222222222222222222222222222222',
   '1111111111111111111111111111111111111111111111111111111111111111',
   NOW() - INTERVAL '1 day'),
  ('b4000000-0000-4000-8000-000000000003',
   '12345678901', 'platform', 'REVIEW_OPEN',
   '{"reviewId":"b2000000-0000-4000-8000-000000000002"}',
   '3333333333333333333333333333333333333333333333333333333333333333',
   '2222222222222222222222222222222222222222222222222222222222222222',
   NOW() - INTERVAL '4 hours'),
  ('b4000000-0000-4000-8000-000000000004',
   NULL, 'platform', 'POLICY_VIEW',
   '{"baseline":"POL-2026.07.1","authorFilter":null}',
   '4444444444444444444444444444444444444444444444444444444444444444',
   '3333333333333333333333333333333333333333333333333333333333333333',
   NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO UPDATE SET
  actor_id = EXCLUDED.actor_id, payload_json = EXCLUDED.payload_json;

-- Policy authored by platform (além das seeds Flyway)
INSERT INTO tb_policy_version (
  id, version, status, artifact_json, artifact_hash, author, approval_id,
  effective_at, release_note, git_commit, created_at, published_at, immutable
) VALUES
  ('b5000000-0000-4000-8000-000000000001',
   'POL-2026.09.PLATFORM.1', 'PUBLISHED',
   '{"rules":[{"code":"MIN_SCORE","value":600}],"owner":"platform"}',
   'sha256:lab-platform-policy-1', 'platform', 'APR-LAB-PLATFORM-1',
   NOW() - INTERVAL '7 days', 'Baseline lab vinculada ao operador platform', 'labdeadbeef01',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days', true),
  ('b5000000-0000-4000-8000-000000000002',
   'POL-2026.09.PLATFORM.DRAFT', 'DRAFT',
   '{"rules":[{"code":"MIN_SCORE","value":620}],"owner":"platform"}',
   'sha256:lab-platform-policy-draft', 'platform', NULL,
   NULL, 'Rascunho platform — aguarda comitê', NULL,
   NOW() - INTERVAL '1 day', NULL, false)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status, author = EXCLUDED.author, artifact_json = EXCLUDED.artifact_json;

-- Dispute timeline: platform como ator operacional (após DELETE acima no bloco contestação)
INSERT INTO tb_dispute_timeline (dispute_id, event_type, message, actor, at) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'ASSIGNED', 'Fila atribuída ao operador platform', 'platform', NOW() - INTERVAL '5 hours'),
  ('e1000000-0000-4000-8000-000000000002', 'NOTE', 'Diligência em andamento (platform)', 'platform', NOW() - INTERVAL '12 hours');

-- PJ: ator lab estável (não depende do sub Keycloak que muda no reimport)
-- UUID canônico lab do operador platform
UPDATE tb_pj_opinion SET created_by = 'b7000000-0000-4000-8000-0000000000aa'
WHERE id IN ('a7000000-0000-4000-8000-000000000001', 'a7000000-0000-4000-8000-000000000002');

INSERT INTO tb_pj_approval_trail (id, opinion_id, action, actor_id, level_code, comment, at) VALUES
  ('a7000000-0000-4000-8000-000000000012', 'a7000000-0000-4000-8000-000000000001',
   'SUBMIT', 'b7000000-0000-4000-8000-0000000000aa', 'L2', 'Submit por operador platform (lab)', NOW() - INTERVAL '90 minutes')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Resumo
SELECT 'score_current' AS tabela, COUNT(*)::text AS n FROM tb_score_current
UNION ALL SELECT 'score_history', COUNT(*)::text FROM tb_score_history WHERE documento LIKE '1%' OR documento LIKE '9%'
UNION ALL SELECT 'golden_record', COUNT(*)::text FROM tb_golden_record
UNION ALL SELECT 'identity_candidate', COUNT(*)::text FROM tb_identity_candidate
UNION ALL SELECT 'decision', COUNT(*)::text FROM tb_decision
UNION ALL SELECT 'dispute', COUNT(*)::text FROM tb_dispute
UNION ALL SELECT 'consent', COUNT(*)::text FROM tb_consent
UNION ALL SELECT 'pf_snapshot', COUNT(*)::text FROM tb_pf_snapshot
UNION ALL SELECT 'pj_opinion', COUNT(*)::text FROM tb_pj_opinion
UNION ALL SELECT 'review', COUNT(*)::text FROM tb_review
UNION ALL SELECT 'subject_request', COUNT(*)::text FROM tb_subject_request
UNION ALL SELECT 'audit_event', COUNT(*)::text FROM tb_audit_event
UNION ALL SELECT 'policy_version', COUNT(*)::text FROM tb_policy_version;

-- Consentimento biométrico lab (FE LAB_CUSTOMER_ID)
INSERT INTO tb_biometric_consent (
  id, customer_id, term_version, status, consented_at, ip_address, user_agent, created_at, updated_at
) VALUES
  ('b6000000-0000-4000-8000-000000000001',
   '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', 'v1.0', 'ACTIVE',
   NOW() - INTERVAL '1 day', '127.0.0.1', 'prisma-lab-seed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (customer_id, term_version) DO UPDATE SET
  status = 'ACTIVE', revoked_at = NULL, updated_at = NOW();

