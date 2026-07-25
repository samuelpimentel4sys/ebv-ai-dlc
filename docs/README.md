# Plataforma Global de FX e Movimentação de Divisas — Banco Inter

Bem-vindo ao repositório centralizado da **Plataforma Global de FX (Banco Inter)**. Este repositório contém os entregáveis e artefatos de engenharia estratégica gerados sob a metodologia **UpStream Foursys (The Visionary — Versão 1.0.0)**.

A iniciativa visa estender a atual infraestrutura da Conta Global em Dólares (USD) para suportar custódia e movimentação internacional de múltiplas moedas (multimoedas), iniciando prioritariamente pela **Europa e o Euro (EUR)**.

---

## 📂 Estrutura de Documentos do Projeto (UpStream)

Toda a documentação estratégica e técnica foi de decomposta e está disponível para navegação e download nos links abaixo:

### 🌟 Fase de Alinhamento e Negócios
* **[01. Descoberta Estratégica](./01_Descoberta_Banco_Inter.html)**  
  *Entendimento do mercado, principais dores do cliente, oportunidades competitivas e Personas de Negócios.*
* **[02. Portfólio de Épicos e Racional RICE](./02_Epicos_Candidatos_Banco_Inter.html)**  
  *Lista detalhada de candidatos a épicos e matriz de priorização baseada no framework RICE.*
* **[03. Benchmark Competitivo](./03_Benchmark_Banco_Inter.html)**  
  *Análise comparativa das principais contas globais brasileiras (Wise, C6, Nomad, Avenue) e posicionamento estratégico do Banco Inter.*
* **[04. Viabilidade Financeira e ROI](./04_ROI_Banco_Inter.html)**  
  *Business case detalhado para 18 meses, investimentos (Capex e Opex), projeções de receitas de spread cambial e cálculo de payback, VPL e TIR.*

### 🛠️ Fase de Detalhamento Técnico (Especificações de Épicos)
* **[05. Épico 01 - FX Orchestrator & State Machine](./05_Epico_01_FX_Orchestrator.html) (Jira: `SCRUM-1`)**  
  *Orquestração resiliente via AWS Step Functions, controle transacional distributivo (Padrão Saga) e idempotência em Redis.*
* **[05. Épico 02 - Integração Core EUA Finxact](./05_Epico_02_Integraçao_Core_EUA.html) (Jira: `SCRUM-2`)**  
  *Controle de sub-posições cambiais multi-ledger, holding temporário de saldo (Mode 4) e liquidação contábil final (Mode 2).*
* **[05. Épico 03 - Integração FX Gateway Tazapay](./05_Epico_03_Payout_Gateway_Tazapay.html) (Jira: `SCRUM-3`)**  
  *Cotação cambial em tempo real, fechamento de câmbio na API da Tazapay (v3) e monitoramento de webhooks de transferências locais (Rede SEPA).*
* **[05. Épico 04 - Motor de Remessa Interna (BR ➔ EUA)](./05_Epico_04_Remessa_Interna.html) (Jira: `SCRUM-4`)**  
  *Trâmite regulatório do Banco Central do Brasil, cálculo e recolhimento de IOF de saída cambial, e transferência para conta nos EUA.*
* **[05. Épico 05 - Motor de AML & Compliance Transacional](./05_Epico_05_AML_Compliance.html) (Jira: `SCRUM-5`)**  
  *Validação em listas de sanções em tempo real (OFAC, PEP), conformidade com a Travel Rule e relatórios regulatórios.*
* **[05. Épico 06 - Autorização de Cartão Multimoeda](./05_Epico_06_Cartao_Multimoeda.html) (Jira: `SCRUM-6`)**  
  *Processamento de mensagens ISO 8583 locais de adquirentes internacionais na rede europeia e roteamento de débitos a partir das sub-posições cambiais.*

### 📊 Relatório Geral
* **[06. Relatório Executivo Consolidado](./06_Consolidado_Banco_Inter_FX.html) (Jira: `SCRUM-7`)**  
  *O "Caminho do Dinheiro" e o mapa geral de sequência transacional, combinando as premissas de modelagem financeira de suporte, arquitetura unificada e roadmap estratégico de implantação.*

---

## 🎯 Próximos Passos (Transição para UpStream Compass)

Com a arquitetura conceitual e financeira aprovada e os épicos criados e vinculados no Jira, a iniciativa está pronta para a **Fase de Engenharia e Especificação Ágil**:
1. Decomposição dos épicos de prioridade `P0` e `P1` em Features de Produto.
2. Criação das histórias de usuário com seus respectivos critérios de aceitação (Gherkin/BDD).
3. Mapeamento detalhado dos JSON schemas das APIs de cotação e de sub-ledgers.
