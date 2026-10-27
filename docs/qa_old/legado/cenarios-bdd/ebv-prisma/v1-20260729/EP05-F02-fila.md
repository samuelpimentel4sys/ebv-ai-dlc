# EP05-F02 — Fila de Contestações · Cenários BDD

| Meta | Valor |
|------|-------|
| Projeto | EBV Prisma |
| Tela | DisputeQueuePage |
| Versão | v1-20260729 |
| Gerado | 29/07/2026 |
| Agente | GherkinFlow |
| Total | 12 (6 Positivo · 4 Negativo · 2 Regressivo) |
| Par HTML | [EP05-F02-fila.html](./EP05-F02-fila.html) |

## Tabela BDD (7 colunas)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|--------------------------|--------------|---------------|--------------|----------|----------------------|
| EP05-F02-01 | Positivo · Fila ordenada por SLA | Dado que o analista possui ROLE_ANALISTA_CONTESTACAO e existem contestações em andamento com prazos distintos | Quando acessa a fila operacional em `/disputas/fila` | Então a tabela lista as contestações ordenadas pelo prazo SLA mais próximo | E o protocolo CT-2026-448120 aparece conforme criticidade do due_at | DisputeQueuePage.tsx · GET /api/v1/disputes/queue |
| EP05-F02-02 | Positivo · Filtro por canal portal | Dado que a fila contém contestações dos canais portal, SAC e B2B | Quando o analista seleciona o filtro de canal Portal | Então apenas contestações originadas no portal são exibidas | E a contagem de linhas reflete o filtro aplicado | DisputeQueuePage.tsx · channel-filter |
| EP05-F02-03 | Positivo · Filtro por canal SAC | Dado que existem contestações abertas pelo canal SAC | Quando o analista seleciona o filtro de canal SAC | Então somente registros do canal SAC permanecem visíveis na fila | E a ordenação por SLA due é preservada no resultado filtrado | DisputeQueuePage.tsx · channel-filter |
| EP05-F02-04 | Positivo · Tratar linha da fila | Dado que o analista visualiza a contestação CT-2026-448120 na fila | Quando aciona o botão Tratar na linha correspondente | Então o drawer de tratamento é aberto com dados da contestação | E os campos de desfecho e fundamentação ficam disponíveis | DisputeQueuePage.tsx · tratar-row |
| EP05-F02-05 | Positivo · Desfecho PROCEDENTE com fundamentação | Dado que o analista abriu o tratamento da contestação CT-2026-448120 | Quando seleciona desfecho PROCEDENTE, informa fundamentação com no mínimo 50 caracteres e registra o desfecho | Então o sistema conclui a contestação com sucesso | E a fila deixa de exibir o protocolo como pendente | DisputeQueuePage.tsx · PATCH /api/v1/disputes/{id}/resolve |
| EP05-F02-06 | Positivo · Desfecho IMPROCEDENTE | Dado que o analista está tratando contestação em diligência concluída | Quando registra desfecho IMPROCEDENTE com fundamentação válida | Então a API retorna status CONCLUIDA com outcome IMPROCEDENTE | E a linha do tempo recebe evento de conclusão auditável | DisputeQueuePage.tsx · PATCH /api/v1/disputes/{id}/resolve |
| EP05-F02-07 | Negativo · Fundamentação ausente | Dado que o analista abriu o drawer de desfecho para uma contestação em andamento | Quando tenta registrar desfecho PROCEDENTE sem preencher fundamentação | Então o sistema bloqueia o envio com validação de campo obrigatório | E a API retorna HTTP 422 quando submetido sem rationale | DisputeQueuePage.tsx · RN003 |
| EP05-F02-08 | Negativo · Transição inválida de estado | Dado que a contestação CT-2026-448120 já está CONCLUIDA | Quando o analista tenta registrar novo desfecho via PATCH resolve | Então a API retorna HTTP 409 de transição inválida | E a tela exibe mensagem de conflito de estado | PATCH /api/v1/disputes/{id}/resolve · RN005 |
| EP05-F02-09 | Negativo · Analista sem permissão | Dado que o usuário autenticado não possui ROLE_ANALISTA_CONTESTACAO | Quando tenta acessar GET /api/v1/disputes/queue | Então a API retorna HTTP 403 de acesso negado | E a fila operacional não é renderizada na interface | DisputeQueuePage.tsx · SecurityConfig |
| EP05-F02-10 | Negativo · Fila vazia após filtro | Dado que não existem contestações em andamento para o canal Procon | Quando o analista aplica filtro de canal Procon | Então a tabela exibe estado vazio com mensagem informativa | E nenhuma linha clicável de Tratar é apresentada | DisputeQueuePage.tsx · dispute-queue-table |
| EP05-F02-11 | Regressivo · Exclusão de concluídas | Dado que existem contestações CONCLUIDAS e EM_ANDAMENTO na base | Quando o analista carrega a fila sem filtros adicionais | Então contestações concluídas não aparecem na listagem operacional | E apenas registros elegíveis para tratamento permanecem visíveis · reg-note: validar após resolve EP05-F02-05 | DisputeQueuePage.tsx · GET /api/v1/disputes/queue |
| EP05-F02-12 | Regressivo · Ordenação SLA após refresh | Dado que a fila exibe múltiplas contestações com due_at distintos | Quando o analista recarrega a página ou atualiza a fila | Então a ordenação por prazo SLA ascendente é mantida | E o protocolo mais crítico permanece no topo da lista · reg-note: smoke pós-deploy fila | DisputeQueuePage.tsx · GET /api/v1/disputes/queue |
