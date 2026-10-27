# Cenários BDD — EP-05 · Contestação & Console B2B

Modo: **live** (FE `VITE_DATA_MODE=live` · BFF Java `:8080` · Postgres Supabase).  
Massa mock CT-2026-448120 **não** está no banco desta execução.

| Tipo | Qtd |
|---|:---:|
| ✅ Positivo | 3 |
| ❌ Negativo | 6 |
| 🔁 Regressivo | 1 |
| **Total** | **10** |

## Acompanhar contestação

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| T-01 | [Negativo] Protocolo de demo ausente no banco live não abre o acompanhamento | um titular com o protocolo CT-2026-448120 que a API não localiza | a consulta de acompanhamento é aberta | o titular vê que os dados não puderam ser carregados | o detalhe da linha do tempo permanece oculto | `DisputeTrackingPage.tsx:49 — useDataQuery` · `dispute.ts:272 — fetchDisputeTrackingLive` |
| T-02 | [Negativo] Protocolo ou documento inválidos bloqueiam a consulta | um titular sem protocolo completo nem CPF com 11 dígitos | a consulta é submetida | mensagens de validação orientam o formato correto | o detalhe da contestação permanece oculto | `DisputeTrackingPage.tsx:86 — consult()` |

## Fila de tratativas

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| Q-01 | [Regressivo] Fila live sem casos pendentes informa fila zerada | um analista de contestação com a fila operacional vazia no banco | a fila é consultada | a orientação de fila zerada é exibida | nenhum painel de desfecho é aberto | `DisputeQueuePage.tsx:221 — empty` · `dispute.ts:225 — fetchDisputeQueueLive` |
| Q-02 | [Negativo] Fundamentação curta impede concluir o caso | um analista de contestação com o painel de tratativa aberto | o desfecho é enviado com fundamentação inferior a 20 caracteres | a conclusão é recusada com alerta de auditoria | o caso permanece na fila | `DisputeQueuePage.tsx:142 — resolve()` |
| Q-03 | [Negativo] Filtro de canal sem casos informa fila vazia daquele canal | um analista de contestação na fila com filtro diferente de todos os canais | nenhum caso daquele canal está pendente | uma orientação para voltar a todos os canais é exibida | a fila completa permanece acessível ao limpar o filtro | `DisputeQueuePage.tsx:226 — noResults` |

## Contratação self-service

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| O-01 | [Positivo] Empresa conclui a contratação até a credencial sandbox | um representante legal com CNPJ, dados pessoais e plano válidos | as etapas de identificação, verificação e aceite do contrato são concluídas | a contratação é confirmada | a credencial de sandbox é exibida uma única vez | `OnboardingPage.tsx:118 — next()` · `b2bConsole.ts:47 — startOnboardingLive` |
| O-02 | [Negativo] CNPJ incompleto bloqueia a primeira etapa | um representante legal com CNPJ diferente de 14 dígitos | a validação cadastral da empresa é solicitada | o avanço é recusado com orientação de formato | os dados já informados são preservados | `OnboardingPage.tsx:90 — validate()` |

## Console de consumo

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| C-01 | [Positivo] Admin B2B consulta consumo e fatura projetada | um administrador da conta B2B com uso faturável no tenant demo | o console de consumo é aberto | consultas, fatura projetada e o produto credit.score aparecem | o histórico inclui a fatura INV-2026-07-001 | `ConsolePage.tsx:222 — Metric` · `b2bConsole.ts:196 — fetchConsoleLive` |
| C-02 | [Negativo] Fatura vencida alerta risco de suspensão da API | um administrador da conta B2B com fatura em atraso | o console de consumo é aberto | um alerta de fatura vencida é exibido | o risco de suspensão após 15 dias é informado | `ConsolePage.tsx:215 — Notice vencida` |
| C-04 | [Positivo] Atalho de credenciais leva à gestão de API | um administrador da conta B2B no console de consumo com dados live | a gestão de credenciais é acionada | a tela de credenciais e escopos de API é apresentada | a rota permanece a de credenciais da conta | `ConsolePage.tsx:296 — Link /b2b/credenciais` · `CredentialsPage.tsx:237 — title` |
