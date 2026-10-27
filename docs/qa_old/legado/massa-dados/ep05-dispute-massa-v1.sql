-- [VERSAO] v1 · 20260729
-- [DIALETO] PostgreSQL 16
-- [MODULO] ep05-dispute · EBV Prisma · DataForge
-- [TABELAS] tb_dispute · tb_dispute_timeline · tb_dispute_attachment
-- [NEGATIVO] CT-9999-000000: protocolo inexistente (404 EP05-F01-11) — NÃO inserir
-- [NEGATIVO] CT-2026-448099: status CONCLUIDA — PATCH resolve retorna 409 (EP05-F02-08)
-- [ALIAS] DSP-2026-0001847 ≡ formato alternativo de protocolo (F01 demo API)

BEGIN;

-- ---------------------------------------------------------------------------
-- tb_dispute (12 linhas)
-- status: EM_ANDAMENTO (fila) | CONCLUIDA (resolvida / regressivo)
-- ---------------------------------------------------------------------------
INSERT INTO tb_dispute (id, protocol, documento, status, reason_code, description, channel, due_at, resolved_at, resolution_outcome, resolution_rationale, created_at) VALUES
-- Demo MARIA — tracking F01 (EM_DILIGENCIA_FONTE via timeline)
('a0000001-0001-4001-8001-000000000001', 'CT-2026-448120', '12345678901', 'EM_ANDAMENTO', 'REGISTRO_INDEVIDO',
 'Apontamento REG-88120 (Loja Bonfim Varejo) R$ 1.284,90 alegadamente quitado em 20/07/2026', 'portal',
 '2026-08-03T23:59:59+00', NULL, NULL, NULL, '2026-07-24T14:05:00+00'),

-- IDOR — titular distinto (EP05-F01-12)
('a0000002-0002-4002-8002-000000000002', 'CT-2026-999999', '52998224725', 'EM_ANDAMENTO', 'HOMONIMO',
 'Contestação de homônimo — dívida de terceiro vinculada ao CPF', 'portal',
 '2026-08-05T23:59:59+00', NULL, NULL, NULL, '2026-07-22T10:30:00+00'),

-- 409 transição inválida — já CONCLUIDA (EP05-F02-08)
('a0000003-0003-4003-8003-000000000003', 'CT-2026-448099', '34879381543', 'CONCLUIDA', 'REGISTRO_INDEVIDO',
 'Contestação encerrada procedente — não reabrir via PATCH', 'portal',
 '2026-07-28T23:59:59+00', '2026-07-27T16:42:00+00', 'PROCEDENTE',
 'Fonte informante não comprovou a dívida no prazo interno. Aplicação RN002 — decisão em favor do titular conforme Súmula 548/STJ.', '2026-07-20T09:00:00+00'),

-- Regressivo — CONCLUIDA IMPROCEDENTE (EP05-F02-11 exclusão fila)
('a0000004-0004-4004-8004-000000000004', 'CT-2026-447501', '61984725319', 'CONCLUIDA', 'CONSULTA_INDEVIDA',
 NULL, 'sac',
 '2026-07-25T23:59:59+00', '2026-07-24T11:15:00+00', 'IMPROCEDENTE',
 'Credor comprovou origem legítima da consulta com autorização expressa do titular em 14/05/2026.', '2026-07-18T08:20:00+00'),

-- Procon histórico CONCLUIDA — filtro vazio F02-10 (nenhum procon EM_ANDAMENTO)
('a0000005-0005-4005-8005-000000000005', 'CT-2026-448094', '48125763937', 'CONCLUIDA', 'DADOS_CADASTRAIS',
 'Endereço desatualizado informado via Procon', 'procon',
 '2026-07-28T08:30:00+00', '2026-07-26T17:00:00+00', 'PARCIALMENTE_PROCEDENTE',
 'Correção cadastral parcial aplicada; demais campos mantidos conforme comprovação da fonte.', '2026-07-23T08:30:00+00'),

-- Fila SAC — SLA crítico
('a0000006-0006-4006-8006-000000000006', 'CT-2026-448061', '75361928437', 'EM_ANDAMENTO', 'CONSULTA_INDEVIDA',
 'Consulta indevida ao CPF por cliente B2B sem base legal', 'sac',
 '2026-07-31T19:14:00+00', NULL, NULL, NULL, '2026-07-26T19:14:00+00'),

-- Fila B2B — canal b2b
('a0000007-0007-4007-8007-000000000007', 'CT-2026-448012', '34857192691', 'EM_ANDAMENTO', 'HOMONIMO',
 'Homônimo: dívida de terceiro no CPF do colaborador', 'b2b',
 '2026-08-01T07:45:00+00', NULL, NULL, NULL, '2026-07-27T07:45:00+00'),

-- Fila portal — due_at mais próximo (topo fila F02-01 / F02-12)
('a0000008-0008-4008-8008-000000000008', 'CT-2026-447890', '92648105794', 'EM_ANDAMENTO', 'REGISTRO_INDEVIDO',
 'Negativação após quitação comprovada parcialmente', 'portal',
 '2026-07-30T08:00:00+00', NULL, NULL, NULL, '2026-07-27T08:00:00+00'),

-- Fila SAC — médio prazo
('a0000009-0009-4009-8009-000000000009', 'CT-2026-447812', '18524796391', 'EM_ANDAMENTO', 'REGISTRO_INDEVIDO',
 NULL, 'sac',
 '2026-08-05T14:00:00+00', NULL, NULL, NULL, '2026-07-25T14:00:00+00'),

-- Fila B2B — representante Vega (Paula CPF)
('a0000010-0010-4010-8010-000000000010', 'CT-2026-447701', '32198765400', 'EM_ANDAMENTO', 'CONSULTA_INDEVIDA',
 'Consulta massiva sem finalidade — cliente Fintech Vega', 'b2b',
 '2026-08-06T12:00:00+00', NULL, NULL, NULL, '2026-07-26T12:00:00+00'),

-- Alias DSP — formato API alternativo
('a0000011-0011-4011-8011-000000000011', 'DSP-2026-0001847', '40730217027', 'EM_ANDAMENTO', 'REGISTRO_INDEVIDO',
 'Contestação aberta via integração API — protocolo DSP', 'portal',
 '2026-08-02T10:00:00+00', NULL, NULL, NULL, '2026-07-27T10:00:00+00'),

-- Fila portal — complemento ordenação SLA
('a0000012-0012-4012-8012-000000000012', 'CT-2026-447580', '58392061489', 'EM_ANDAMENTO', 'DADOS_CADASTRAIS',
 'Telefone e e-mail desatualizados no cadastro positivo', 'portal',
 '2026-08-04T18:00:00+00', NULL, NULL, NULL, '2026-07-28T18:00:00+00');

-- ---------------------------------------------------------------------------
-- tb_dispute_timeline (22 linhas) — ordem cronológica por dispute_id
-- ---------------------------------------------------------------------------
INSERT INTO tb_dispute_timeline (dispute_id, event_type, message, actor, at) VALUES
-- MARIA CT-2026-448120 (F01 stepper / timeline)
('a0000001-0001-4001-8001-000000000001', 'RECEBIDA', 'Protocolo CT-2026-448120 gerado no portal do titular.', 'TITULAR', '2026-07-24T14:05:00+00'),
('a0000001-0001-4001-8001-000000000001', 'EM_ANALISE', 'Caso atribuído à equipe de tratativa com prioridade alta.', 'ANALISTA', '2026-07-25T09:12:00+00'),
('a0000001-0001-4001-8001-000000000001', 'EM_DILIGENCIA_FONTE', 'Consulta enviada à fonte informante. Aguardando resposta.', 'SISTEMA', '2026-07-28T09:05:00+00'),

-- IDOR CT-2026-999999
('a0000002-0002-4002-8002-000000000002', 'RECEBIDA', 'Contestação registrada via portal.', 'TITULAR', '2026-07-22T10:30:00+00'),
('a0000002-0002-4002-8002-000000000002', 'EM_ANALISE', 'Análise preliminar em andamento.', 'ANALISTA', '2026-07-23T11:00:00+00'),

-- 409 CT-2026-448099 (CONCLUIDA)
('a0000003-0003-4003-8003-000000000003', 'RECEBIDA', 'Protocolo registrado.', 'TITULAR', '2026-07-20T09:00:00+00'),
('a0000003-0003-4003-8003-000000000003', 'EM_ANALISE', 'Análise concluída.', 'ANALISTA', '2026-07-21T14:00:00+00'),
('a0000003-0003-4003-8003-000000000003', 'EM_DILIGENCIA_FONTE', 'Prazo da fonte encerrado sem comprovação.', 'FONTE', '2026-07-26T09:00:00+00'),
('a0000003-0003-4003-8003-000000000003', 'CONCLUIDA', 'Desfecho PROCEDENTE registrado.', 'ANALISTA', '2026-07-27T16:42:00+00'),

-- CONCLUIDA CT-2026-447501
('a0000004-0004-4004-8004-000000000004', 'RECEBIDA', 'Abertura via SAC.', 'TITULAR', '2026-07-18T08:20:00+00'),
('a0000004-0004-4004-8004-000000000004', 'EM_ANALISE', 'Análise documental.', 'ANALISTA', '2026-07-19T10:00:00+00'),
('a0000004-0004-4004-8004-000000000004', 'CONCLUIDA', 'Desfecho IMPROCEDENTE.', 'ANALISTA', '2026-07-24T11:15:00+00'),

-- CONCLUIDA procon CT-2026-448094
('a0000005-0005-4005-8005-000000000005', 'RECEBIDA', 'Reclamação Procon encaminhada.', 'TITULAR', '2026-07-23T08:30:00+00'),
('a0000005-0005-4005-8005-000000000005', 'CONCLUIDA', 'Desfecho parcialmente procedente.', 'ANALISTA', '2026-07-26T17:00:00+00'),

-- Fila CT-2026-448061
('a0000006-0006-4006-8006-000000000006', 'RECEBIDA', 'Protocolo SAC aberto.', 'TITULAR', '2026-07-26T19:14:00+00'),
('a0000006-0006-4006-8006-000000000006', 'EM_ANALISE', 'Triagem prioritária.', 'ANALISTA', '2026-07-27T09:00:00+00'),

-- Fila CT-2026-448012
('a0000007-0007-4007-8007-000000000007', 'RECEBIDA', 'Contestação B2B registrada.', 'TITULAR', '2026-07-27T07:45:00+00'),

-- Fila CT-2026-447890 (crítico)
('a0000008-0008-4008-8008-000000000008', 'RECEBIDA', 'Contestação portal.', 'TITULAR', '2026-07-27T08:00:00+00'),
('a0000008-0008-4008-8008-000000000008', 'EM_ANALISE', 'SLA crítico — prazo em 1 dia útil.', 'ANALISTA', '2026-07-28T08:00:00+00'),

-- DSP-2026-0001847
('a0000011-0011-4011-8011-000000000011', 'RECEBIDA', 'Abertura via API integração.', 'SISTEMA', '2026-07-27T10:00:00+00'),
('a0000011-0011-4011-8011-000000000011', 'EM_ANALISE', 'Análise automática concluída — fila humana.', 'SISTEMA', '2026-07-28T10:00:00+00');

-- ---------------------------------------------------------------------------
-- tb_dispute_attachment (8 linhas) — cadeia versionamento F08 em MARIA
-- ---------------------------------------------------------------------------
INSERT INTO tb_dispute_attachment (id, dispute_id, filename, content_type, sha256, storage_uri, prev_attachment_id, created_at) VALUES
('b0000001-0001-4001-8001-000000000001', 'a0000001-0001-4001-8001-000000000001',
 'comprovante-pagamento-v1.pdf', 'application/pdf',
 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
 's3://prisma-lab/disputes/a0000001/comprovante-pagamento-v1.pdf', NULL, '2026-07-24T14:10:00+00'),

('b0000002-0002-4002-8002-000000000002', 'a0000001-0001-4001-8001-000000000001',
 'comprovante-pagamento-v2.pdf', 'application/pdf',
 '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
 's3://prisma-lab/disputes/a0000001/comprovante-pagamento-v2.pdf',
 'b0000001-0001-4001-8001-000000000001', '2026-07-25T11:30:00+00'),

('b0000003-0003-4003-8003-000000000003', 'a0000001-0001-4001-8001-000000000001',
 'identidade-frente.jpg', 'image/jpeg',
 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
 's3://prisma-lab/disputes/a0000001/identidade-frente.jpg', NULL, '2026-07-24T14:12:00+00'),

('b0000004-0004-4004-8004-000000000004', 'a0000006-0006-4006-8006-000000000006',
 'autorizacao-consulta.pdf', 'application/pdf',
 '7694f4a77126e3b7f9e7d9b9a5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5b5',
 's3://prisma-lab/disputes/a0000006/autorizacao-consulta.pdf', NULL, '2026-07-26T20:00:00+00'),

('b0000005-0005-4005-8005-000000000005', 'a0000007-0007-4007-8007-000000000007',
 'documento-homonimo.pdf', 'application/pdf',
 '4815162342c22b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3',
 's3://prisma-lab/disputes/a0000007/documento-homonimo.pdf', NULL, '2026-07-27T08:00:00+00'),

('b0000006-0006-4006-8006-000000000006', 'a0000008-0008-4008-8008-000000000008',
 'recibo-quitacao.png', 'image/png',
 '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
 's3://prisma-lab/disputes/a0000008/recibo-quitacao.png', NULL, '2026-07-27T09:00:00+00'),

('b0000007-0007-4007-8007-000000000007', 'a0000010-0010-4010-8010-000000000010',
 'relatorio-consultas-vega.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'd4735e3a265e16eee03f59718b9b9d4dba3a0c2594205a7262aeae123173a5f',
 's3://prisma-lab/disputes/a0000010/relatorio-consultas-vega.xlsx', NULL, '2026-07-26T13:00:00+00'),

('b0000008-0008-4008-8008-000000000008', 'a0000003-0003-4003-8003-000000000003',
 'parecer-analista-conclusao.pdf', 'application/pdf',
 'ef2d127de37b942baad06145e54b73c7b7b8c8d8d8d8d8d8d8d8d8d8d8d8d8d8d8',
 's3://prisma-lab/disputes/a0000003/parecer-analista-conclusao.pdf', NULL, '2026-07-27T16:40:00+00');

COMMIT;

-- [CONTAGEM] tb_dispute: 12 | tb_dispute_timeline: 22 | tb_dispute_attachment: 8
-- [NEGATIVO NÃO INSERIDO] CT-9999-000000 → HTTP 404
-- [409 SEED] dispute_id a0000003-0003-4003-8003-000000000003 · protocol CT-2026-448099 · status CONCLUIDA
