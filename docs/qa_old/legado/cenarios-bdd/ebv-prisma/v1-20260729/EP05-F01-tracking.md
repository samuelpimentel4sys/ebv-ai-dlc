# EP05-F01 — Tracking de Contestação · Cenários BDD

| Meta | Valor |
|------|-------|
| Projeto | EBV Prisma |
| Tela | DisputeTrackingPage |
| Versão | v1-20260729 |
| Gerado | 29/07/2026 |
| Agente | GherkinFlow |
| Total | 14 (8 Positivo · 5 Negativo · 1 Regressivo) |
| Par HTML | [EP05-F01-tracking.html](./EP05-F01-tracking.html) |

## Tabela BDD (7 colunas)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|--------------------------|--------------|---------------|--------------|----------|----------------------|
| EP05-F01-01 | Positivo · Acesso via URL demo | Dado que o titular Maria acessa a rota demo `/titular/contestacoes/CT-2026-448120` | Quando a página de acompanhamento é carregada | Então o protocolo CT-2026-448120 é exibido no cabeçalho | E o formulário de desbloqueio solicita confirmação do CPF do titular | DisputeTrackingPage.tsx |
| EP05-F01-02 | Positivo · Desbloqueio com CPF válido | Dado que o titular informou o protocolo CT-2026-448120 na tela de tracking | Quando informa o CPF 123.456.789-01 e aciona Consultar | Então o acompanhamento é desbloqueado com sucesso | E os dados sensíveis da contestação ficam visíveis | DisputeTrackingPage.tsx · unlockTracking() |
| EP05-F01-03 | Positivo · Stepper de etapas | Dado que o tracking CT-2026-448120 foi desbloqueado para Maria | Quando a seção de etapas da contestação é renderizada | Então o stepper destaca a etapa atual da contestação | E as etapas anteriores aparecem como concluídas | DisputeTrackingPage.tsx · GET /api/v1/disputes/{protocol}/tracking |
| EP05-F01-04 | Positivo · Prazo SLA restante | Dado que a contestação CT-2026-448120 está em andamento | Quando o painel de prazo SLA é exibido após desbloqueio | Então o sistema apresenta os dias úteis restantes e a data limite | E a barra de progresso do prazo SLA reflete o consumo do prazo | DisputeTrackingPage.tsx · sla-progress |
| EP05-F01-05 | Positivo · Linha do tempo completa | Dado que o titular desbloqueou o protocolo CT-2026-448120 com CPF válido | Quando solicita a visualização da linha do tempo | Então os eventos são listados em ordem cronológica crescente | E cada evento exibe tipo, data e responsável conforme regra de transparência | DisputeTrackingPage.tsx · GET /api/v1/disputes/{protocol}/timeline |
| EP05-F01-06 | Positivo · Ocultação da fonte em diligência | Dado que a contestação CT-2026-448120 está na etapa de diligência externa | Quando o titular consulta tracking e timeline desbloqueados | Então a próxima ação indica aguardo da fonte informante sem identificá-la | E nenhum dado identificável da fonte é exibido na linha do tempo | DisputeTrackingPage.tsx · RN001 |
| EP05-F01-07 | Positivo · Tracking autenticado JWT | Dado que Maria está autenticada como titular com JWT válido | Quando acessa GET /api/v1/disputes/CT-2026-448120/tracking com Bearer token | Então a API retorna etapa, status, prazo SLA e preview da timeline | E não exige confirmação adicional de CPF na resposta | GET /api/v1/disputes/{protocol}/tracking |
| EP05-F01-08 | Negativo · CPF incorreto — 1ª tentativa | Dado que o protocolo CT-2026-448120 existe e está ativo | Quando o titular informa CPF divergente do cadastro e aciona Consultar | Então o sistema rejeita o desbloqueio com mensagem de confirmação inválida | E o acompanhamento permanece bloqueado sem exibir dados sensíveis | DisputeTrackingPage.tsx · unlockTracking() |
| EP05-F01-09 | Negativo · CPF incorreto — 2ª tentativa | Dado que já houve uma tentativa inválida de CPF para CT-2026-448120 | Quando o titular repete CPF incorreto e aciona Consultar novamente | Então o sistema incrementa o contador de tentativas e mantém o bloqueio | E exibe aviso de tentativas restantes antes do lockout | DisputeTrackingPage.tsx · tb_tracking_lockout |
| EP05-F01-10 | Negativo · Lockout após 3 tentativas | Dado que o titular falhou duas vezes ao confirmar o CPF do protocolo CT-2026-448120 | Quando informa CPF incorreto pela terceira vez consecutiva | Então o sistema aplica lockout de 30 minutos para novas consultas | E retorna HTTP 429 com orientação para aguardar o fim do bloqueio | DisputeTrackingPage.tsx · GET /api/v1/disputes/{protocol}/tracking |
| EP05-F01-11 | Negativo · Protocolo inexistente | Dado que não existe contestação com protocolo CT-9999-000000 | Quando o titular informa esse protocolo e CPF 123.456.789-01 | Então o sistema retorna erro de protocolo não encontrado | E nenhum dado de tracking ou timeline é exibido | GET /api/v1/disputes/{protocol}/tracking |
| EP05-F01-12 | Negativo · IDOR — protocolo de outro titular | Dado que Maria está autenticada e existe contestação CT-2026-999999 de outro titular | Quando solicita tracking autenticado desse protocolo alheio | Então a API retorna HTTP 403 de acesso negado | E a tela não revela etapa, prazo ou eventos da contestação alheia | GET /api/v1/disputes/{protocol}/tracking · RN003 |
| EP05-F01-13 | Negativo · Erro de estado da API | Dado que o serviço de tracking está indisponível ou retorna falha interna | Quando o titular desbloqueia CT-2026-448120 com CPF válido | Então a tela exibe estado de erro amigável ao titular | E não apresenta stepper ou timeline parcialmente inconsistentes | DisputeTrackingPage.tsx · state error |
| EP05-F01-14 | Regressivo · Consistência stepper e timeline | Dado que o tracking CT-2026-448120 foi desbloqueado com CPF 123.456.789-01 | Quando o titular alterna entre stepper, prazo SLA e linha do tempo | Então a etapa atual permanece consistente entre todos os blocos | E o preview da timeline no tracking coincide com a timeline completa · reg-note: validar após deploy EP-04 | DisputeTrackingPage.tsx · GET /api/v1/disputes/{protocol}/tracking\|timeline |
