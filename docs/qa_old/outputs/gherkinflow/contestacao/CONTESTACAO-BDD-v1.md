# Cenários BDD — EP-05 · Contestação & Console B2B

| Tipo | Qtd |
|---|:---:|
| ✅ Positivo | 5 |
| ❌ Negativo | 4 |
| 🔁 Regressivo | 1 |
| **Total** | **10** |

## Acompanhar contestação

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| T-01 | [Positivo] Titular acessa o acompanhamento pelo protocolo | um titular com o protocolo CT-2026-448120 recebido no canal digital | a consulta pública do protocolo é aberta | a situação atual, o prazo restante e a linha do tempo são exibidos | a próxima ação pede o comprovante de pagamento | `DisputeTrackingPage.tsx:35 — arrivedWithProtocol` · `DisputeTrackingPage.tsx:182 — Notice prazo` |
| T-02 | [Negativo] Protocolo ou documento inválidos bloqueiam a consulta | um titular sem protocolo completo nem CPF com 11 dígitos | a consulta é submetida | mensagens de validação orientam o formato correto | o detalhe da contestação permanece oculto | `DisputeTrackingPage.tsx:86 — consult()` |

## Fila de tratativas

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| Q-01 | [Positivo] Analista abre a tratativa a partir da fila | um analista de contestação com casos na fila operacional | a fila é consultada e um caso é selecionado | o painel de tratativa exibe objeto, prazo, canal e anexos | o desfecho permanece disponível para conclusão | `DisputeQueuePage.tsx:270 — onRowClick` · `DisputeQueuePage.tsx:281 — Drawer` |
| Q-02 | [Negativo] Fundamentação curta impede concluir o caso | um analista de contestação com o painel de tratativa aberto | o desfecho é enviado com fundamentação inferior a 20 caracteres | a conclusão é recusada com alerta de auditoria | o caso permanece na fila | `DisputeQueuePage.tsx:142 — resolve()` |
| Q-03 | [Regressivo] Filtro de canal sem casos informa fila vazia daquele canal | um analista de contestação na fila com filtro diferente de todos os canais | nenhum caso daquele canal está pendente | uma orientação para voltar a todos os canais é exibida | a fila completa permanece acessível ao limpar o filtro | `DisputeQueuePage.tsx:226 — noResults` |

## Contratação self-service

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| O-01 | [Positivo] Empresa conclui a contratação até a credencial sandbox | um representante legal com CNPJ, dados pessoais e plano válidos | as etapas de identificação, verificação e aceite do contrato são concluídas | a contratação é confirmada | a credencial de sandbox é exibida uma única vez | `OnboardingPage.tsx:118 — next()` · `OnboardingPage.tsx:341 — step === 3` |
| O-02 | [Negativo] CNPJ incompleto bloqueia a primeira etapa | um representante legal com CNPJ diferente de 14 dígitos | a validação cadastral da empresa é solicitada | o avanço é recusado com orientação de formato | os dados já informados são preservados | `OnboardingPage.tsx:92 — validate()` · `OnboardingPage.tsx:177 — Dados incompletos` |

## Console de consumo

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|---|---|---|---|---|---|
| C-01 | [Positivo] Admin B2B consulta consumo e fatura projetada | um administrador da conta B2B com competências faturáveis | o console de consumo é aberto | consultas do mês, fatura projetada e variação aparecem | o histórico de faturas inclui a competência vencida | `ConsolePage.tsx:222 — Metric` · `ConsolePage.tsx:215 — fatura vencida` |
| C-02 | [Negativo] Fatura vencida alerta risco de suspensão da API | um administrador da conta B2B com fatura INV-2026-04 em atraso | o console de consumo é aberto | um alerta de fatura vencida é exibido | o risco de suspensão após 15 dias é informado | `ConsolePage.tsx:215 — Notice vencida` |
| C-04 | [Positivo] Atalho de credenciais leva à gestão de API | um administrador da conta B2B no console de consumo | a gestão de credenciais é acionada | a tela de credenciais e escopos de API é apresentada | a rota permanece a de credenciais da conta | `ConsolePage.tsx:296 — Link /b2b/credenciais` · `CredentialsPage.tsx:237 — title` |
