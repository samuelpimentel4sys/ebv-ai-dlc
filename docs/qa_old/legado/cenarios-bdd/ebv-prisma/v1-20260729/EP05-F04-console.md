# EP05-F04 — Console B2B · Cenários BDD

| Meta | Valor |
|------|-------|
| Projeto | EBV Prisma |
| Tela | ConsolePage |
| Versão | v1-20260729 |
| Gerado | 29/07/2026 |
| Agente | GherkinFlow |
| Total | 10 (7 Positivo · 2 Negativo · 1 Regressivo) |
| Par HTML | [EP05-F04-console.html](./EP05-F04-console.html) |

## Tabela BDD (7 colunas)

| # | Funcionalidade (Feature) | Dado (Given) | Quando (When) | Então (Then) | E… (And) | Referência do Código |
|---|--------------------------|--------------|---------------|--------------|----------|----------------------|
| EP05-F04-01 | Positivo · Métricas de consumo | Dado que o cliente Vega (`vega-prod-4471`) está autenticado no console B2B | Quando acessa `/b2b/console` | Então o painel exibe consultas do mês, fatura projetada, variação e acumulado | E os valores são carregados via API de usage | ConsolePage.tsx · GET /api/v1/console/usage |
| EP05-F04-02 | Positivo · Gráfico de consumo mensal | Dado que o console B2B da Vega está carregado | Quando a seção de gráfico de consumo é renderizada | Então o gráfico mensal de consultas é exibido | E reflete o histórico de consumo do tenant Vega | ConsolePage.tsx · GET /api/v1/console/usage |
| EP05-F04-03 | Positivo · Filtro gráfico 3 meses | Dado que o gráfico de consumo está visível | Quando o representante seleciona filtro de 3 meses | Então o gráfico recalcula exibindo apenas os últimos 3 meses | E as métricas do cabeçalho permanecem coerentes com o período | ConsolePage.tsx |
| EP05-F04-04 | Positivo · Aba Faturas | Dado que o console da Vega possui histórico de faturamento | Quando o representante seleciona a aba Faturas | Então a lista de faturas é exibida com número, valor, status e vencimento | E inclui faturas pagas e pendentes do tenant | ConsolePage.tsx · GET /api/v1/console/invoices |
| EP05-F04-05 | Positivo · Aba Contratos | Dado que a Fintech Vega possui contrato vigente plano Escala | Quando o representante seleciona a aba Contratos | Então o plano vigente, vigência e condições comerciais são exibidos | E os dados correspondem ao contrato ativo do clientId vega-prod-4471 | ConsolePage.tsx · GET /api/v1/console/contracts |
| EP05-F04-06 | Positivo · Identificação Vega no header | Dado que o usuário B2B autenticado pertence ao tenant Vega | Quando o console é carregado | Então o header exibe identificação Fintech Vega e clientId vega-prod-4471 | E o contexto do tenant permanece visível em todas as abas | ConsolePage.tsx |
| EP05-F04-07 | Positivo · Alerta fatura vencida | Dado que existe fatura INV-2026-04 vencida para a Vega | Quando o console B2B é carregado | Então um alerta de fatura vencida é exibido de forma destacada | E referencia a fatura INV-2026-04 com orientação de regularização | ConsolePage.tsx · GET /api/v1/console/invoices |
| EP05-F04-08 | Negativo · Acesso sem autenticação B2B | Dado que o visitante não possui sessão B2B válida | Quando tenta acessar `/b2b/console` diretamente | Então o sistema redireciona para login ou onboarding | E nenhuma métrica ou dado de faturamento é exposto | ConsolePage.tsx · SecurityConfig |
| EP05-F04-09 | Negativo · Erro ao carregar usage | Dado que a API GET /console/usage retorna indisponibilidade | Quando o representante Vega acessa o console | Então a tela exibe estado de erro amigável no painel de métricas | E o gráfico e abas secundárias não apresentam dados inconsistentes | ConsolePage.tsx · GET /api/v1/console/usage |
| EP05-F04-10 | Regressivo · Consistência filtro 6 meses | Dado que o console Vega exibe gráfico com filtro padrão | Quando o representante alterna para filtro de 6 meses e retorna ao padrão | Então as métricas e o gráfico retornam aos valores originais | E não há duplicidade ou perda de pontos no histórico · reg-note: smoke console B2B | ConsolePage.tsx · GET /api/v1/console/usage |
