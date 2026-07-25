# Plataforma Global de FX e Movimentação de Divisas — Banco Inter
> **Framework UpStream Foursys — Metodologia "The Visionary"**

Este repositório armazena a documentação técnica, especificação de arquitetura e modelo de viabilidade financeira consolidado para o projeto de **Plataforma Global de FX (Banco Inter)**.

---

## 📂 Estrutura de Documentos Disponíveis

| Arquivo | Descrição |
|---|---|
| 📄 [`docs/06_Consolidado_Banco_Inter_FX.html`](06_Consolidado_Banco_Inter_FX.html) | **Relatório Consolidado de Negócios e Engenharia (Completo)**. Contém o mapa do fluxo transacional interativo, tabelas de ROI de 18 meses, e detalhamento técnico de cada épico. |
| 📄 `01_Descoberta_Banco_Inter.html` | Descoberta do cenário competitivo, desafios regulatórios do Banco Central e as bases técnicas do projeto. |
| 📄 `02_Epicos_Candidatos_Banco_Inter.html` | Matriz RICE detalhada e justificativa técnica da priorização de escopo. |
| 📄 `03_Benchmark_Banco_Inter.html` | Análise comparativa profunda das ofertas globais de FX de concorrentes (Nomad, Wise, C6 Global e dLocal). |
| 📄 `04_ROI_Banco_Inter.html` | Planilha financeira completa contendo Capex, Opex, projeção de crescimento de clientes e payback detalhado. |

---

## 🎯 Portfólio de Épicos Mapeados no Jira

Toda a estrutura foi criada no Jira do projeto sob os seguintes códigos:

1. **`SCRUM-1` — `[BINTER-EP-01] FX Orchestrator & State Machine` (P0 - Crítica)**
   * *Ação:* Criação do motor de estados assíncronos no AWS Step Functions para gerenciar o padrão de Saga transacional entre o Core BR e o Finxact.
2. **`SCRUM-2` — `[BINTER-EP-02] Integração Core EUA (Finxact)` (P1 - Alta)**
   * *Ação:* Parametrização e customização da conta de depósito e ledger da Finxact para suportar carteiras multimoeda e hold temporário de saldo.
3. **`SCRUM-3` — `[BINTER-EP-03] Integração FX & Payout Gateway (Tazapay)` (P1 - Alta)**
   * *Ação:* Integração das APIs REST v3 da Tazapay para conversão, garantia de taxa spot e liquidação de transferências de divisas na rede SEPA (EUR).
4. **`SCRUM-4` — `[BINTER-EP-04] Motor de Remessa Interna (Core BR ➔ Core EUA)` (P1 - Alta)**
   * *Ação:* Fluxo de conciliação cambial doméstico e transferência regulamentada de BRL para conta americana sob as normas do BACEN.
5. **`SCRUM-5` — `[BINTER-EP-05] Motor de AML & Compliance Transacional` (P2 - Média)**
   * *Ação:* Triagem real-time de conformidade regulatória (PEP, OFAC, sanções) e controle dos limites cambiais.
6. **`SCRUM-6` — `[BINTER-EP-06] Autorização de Cartão de Débito Multimoeda` (P2 - Média)**
   * *Ação:* Adaptação do motor autorizador do cartão (ISO 8583) para efetuar débitos diretos na sub-posição de EUR, economizando spread transacional para o cliente final.

---

## 📊 Principais Indicadores de Viabilidade (ROI)

* **Investimento Inicial (Capex):** R$ 4.200.000,00
* **Payback Estimado:** 7 meses
* **Taxa Interna de Retorno (TIR):** 148%
* **Valor Presente Líquido (VPL):** R$ 12.450.000,00 (considerando uma TMA de 12% a.a.)

Para abrir a visualização executiva de alta fidelidade contendo o mapa de sequência técnico em Mermaid e gráficos financeiros, abra o arquivo [`docs/06_Consolidado_Banco_Inter_FX.html`](06_Consolidado_Banco_Inter_FX.html) diretamente em seu navegador.

---
*Gerado pela IA do UpStream Foursys sob o perfil estratégico **The Visionary**.*