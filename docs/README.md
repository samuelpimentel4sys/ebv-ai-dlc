# 🌍 Plataforma Global de FX & Movimentação de Divisas (Banco Inter)
> **Metodologia UpStream Foursys — Skill: The Visionary (v1.0.0)**

Este diretório contém toda a documentação estratégica, arquitetura de referência de sistemas e modelagem de viabilidade financeira referentes à iniciativa de expansão de divisas internacionais da Conta Global do Banco Inter.

---

## 🗺️ Índice de Artefatos e Especificações Técnicas

Abaixo, navegue diretamente pelos documentos detalhados gerados durante o ciclo de descoberta estratégica e técnica:

### 1. Fase de Alinhamento e Negócios
* **[01. Descoberta e Contexto Estratégico](01_Descoberta_Banco_Inter.html)**
  * Análise das oportunidades competitivas de câmbio instantâneo na Europa, dores diagnósticas do cliente e mapeamento de personas (*Thiago Mendes* e *Mariana Silveira*).
* **[02. Épicos Candidatos e Priorização Científica](02_Epicos_Candidatos_Banco_Inter.html)**
  * Portfólio de soluções estruturado com aplicação da fórmula de priorização RICE para máxima otimização de esforço de engenharia.
* **[03. Benchmark Competitivo Internacional](03_Benchmark_Banco_Inter.html)**
  * Análise profunda sobre as vantagens do Banco Inter em face das alternativas de mercado (*Wise, Nomad e C6 Global*).
* **[04. Modelo de Viabilidade Financeira (ROI)](04_ROI_Banco_Inter.html)**
  * Demonstrativo de fluxo de caixa, CapEx de R$ 4,2M, OpEx, payback estimado (7 meses), VPL e Taxa Interna de Retorno (148%).

### 2. Especificações de Épicos (Fase de Engenharia e Design)
* **[EP-01: FX Orchestrator & State Machine (SCRUM-1)](05_Epico_01_FX_Orchestrator.html)**
  * Design de resiliência e concorrência na AWS via Step Functions, SQS/DLQ e cache de idempotência com Redis.
* **[EP-02: Integração Core EUA Finxact (SCRUM-2)](05_Epico_02_Integracao_Core_EUA.html)**
  * Modelagem de sub-ledgers multi-moeda e gerenciamento de transações (*Mode 4 Hold* / *Mode 2 Post*).
* **[EP-03: Integração FX & Payout Gateway Tazapay (SCRUM-3)](05_Epico_03_Payout_Gateway_Tazapay.html)**
  * Consumo das APIs v3 para cotações e liquidação local no trilho europeu via rede SEPA.
* **[EP-04: Motor de Remessa Interna Core BR ➔ EUA (SCRUM-4)](05_Epico_04_Remessa_Interna.html)**
  * Regras tributárias (IOF), conformidade com o Banco Central do Brasil e fomento de liquidez local.
* **[EP-05: Motor de AML & Compliance Transacional (SCRUM-5)](05_Epico_05_AML_Compliance.html)**
  * Varreduras anti-lavagem de dinheiro, tratamento de listas restritas (OFAC/PEP) e conformidade com a *Travel Rule*.
* **[EP-06: Autorização de Cartão de Débito Multimoeda (SCRUM-6)](05_Epico_06_Cartao_Multimoeda.html)**
  * Processamento do protocolo ISO 8583 e lógica de seleção de saldo multimoeda em tempo real.

### 3. Consolidação Final
* **[06. Relatório de Consolidação Master de Engenharia e ROI (SCRUM-7)](06_Consolidado_Banco_Inter_FX.html)**
  * Visualização integrada do "Caminho do Dinheiro" (fluxo de sequência), roadmap de execução em ondas e resumo econômico.

---

## ⚙️ Conectividade com o Jira
Todos os épicos mapeados neste repositório encontram-se espelhados e priorizados no **Jira do Projeto `SCRUM`** (`SCRUM-1` a `SCRUM-7`), permitindo que as squads ágeis iniciem o processo de decomposição em histórias de usuários na fase subsequente (**UpStream Compass**).