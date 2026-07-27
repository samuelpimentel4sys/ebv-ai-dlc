# Priorização, MVP & Roadmap — EBV Prisma (Equifax | BoaVista)
> **Cliente:** Equifax | BoaVista  
> **Projeto:** EBV Prisma (Plataforma Unificada de Inteligência de Crédito & Prevenção à Fraude)  
> **Data:** 02/03/2025  
> **Elaborado por:** Foursys (Roadmapper V2)  
> **Metodologia:** WSJF (Weighted Shortest Job First) com Lastro & Gate de Viabilidade  

---

## Índice
1. [Resumo Executivo](#1-resumo-executivo)
2. [Modelo Aplicado & Parâmetros de Scoring](#2-modelo-aplicado--parâmetros-de-scoring)
3. [Priorização Consolidada (Tabela WSJF)](#3-priorização-consolidada-tabela-wsjf)
4. [Estratégia do MVP & Hipótese de Valor](#4-estratégia-do-mvp--hipótese-de-valor)
5. [Roadmap de Fases & Mapa de Dependências](#5-roadmap-de-fases--mapa-de-dependências)
6. [Premissas, Riscos & Matriz de Mitigação](#6-premissas-riscos--matriz-de-mitigação)

---

## 1. Resumo Executivo

O projeto **EBV Prisma** visa consolidar os motores de inteligência de crédito, enrichments cadastrais e algoritmos de prevenção a fraude das operações **Equifax | BoaVista** em uma plataforma B2B moderna, unificada, escalável e de altíssima performance.

### Visão Geral do Backlog
- **Total de Features:** 24 features distribuídas em 6 Épicos Estratégicos.
- **Esforço Total Estimado:** 3.220 horas brutas (dimensionadas via `the-estimator`).
- **Quick-Wins Mapeados:** 3 features com altíssimo retorno e esforço extremamente reduzido (F-03, F-04, F-06).
- **Alocação por Fases:**
  - **MVP (Fase 1):** 10 features | 1.440h líquidas (100% da capacidade útil de 3 squads em 3 sprints).
  - **Fase 2 (Escala & Analytics Avançado):** 7 features | 1.060h.
  - **Fase 3 (Expansão & Inovação):** 5 features | 720h.
  - **Parking Lot:** 2 features (bloqueadas por inviabilidade técnica/regulatória temporária).

### Premissas e Inputs Principais
1. **Capacidade Crítica do MVP:** 3 squads dedicadas (18 devs/QAs/DEs) atuando em 3 sprints de 2 semanas (1.440h úteis).
2. **Exigência Regulatório-Legal:** Cumprimento rigoroso da LGPD e regras do Cadastro Positivo (BACEN/ANPD) como pré-requisitos não negociáveis.
3. **Fonte de Estimativa:** Horas derivadas diretamente das estimativas analíticas da ferramenta `the-estimator`.

---

## 2. Modelo Aplicado & Parâmetros de Scoring

O cálculo do score de priorização utiliza a metodologia **WSJF (Weighted Shortest Job First)** ajustada com multiplicador de viabilidade técnica/operacional.

### Formulação Matemática
$$\text{CoD (Cost of Delay)} = (w_1 \cdot \text{Valor}) + (w_2 \cdot \text{ROI}) + (w_3 \cdot \text{Criticidade}) + (w_4 \cdot \text{Risco/Compliance})$$

$$\text{Score WSJF} = \frac{\text{CoD} \times \text{Multiplicador de Viabilidade}}{\text{JobSize}}$$

### Pesos Normalizados ($\sum = 1.00$)
- **$w_1$ Valor de Negócio:** $0,30$ (Impacto na receita e eficiência B2B)
- **$w_2$ ROI (% financeiro convertido em nota):** $0,30$ (Retorno sobre investimento acelerado)
- **$w_3$ Criticidade Temporal:** $0,15$ (Sensibilidade a janelas de mercado)
- **$w_4$ Risco / Compliance:** $0,25$ (Mitigação de multas LGPD e segurança da informação)

### Escalas e Régua de Conversão
- **Notas de Dimensão (Fibonacci):** $1, 2, 3, 5, 8, 13$
- **Régua de ROI (% para Nota):**
  - $< 20\% \rightarrow 1$
  - $20\% \text{ a } 50\% \rightarrow 2$
  - $50\% \text{ a } 100\% \rightarrow 3$
  - $100\% \text{ a } 200\% \rightarrow 5$
  - $200\% \text{ a } 400\% \rightarrow 8$
  - $> 400\% \rightarrow 13$
- **Gate de Viabilidade (Multiplicador):**
  - **Alta:** $1,0$ (Tecnologia madura, squad capacitada)
  - **Média:** $0,8$ (Necessita alinhamento arquitetural moderado)
  - **Baixa:** $0,6$ (Incerteza técnica ou dependência externa complexa)
  - **Muito Baixa:** $0,5$ (Risco elevado de spikes/POCS não validadas)
- **JobSize (Fibonacci por Banda de Horas):**
  - $\le 80\text{h} \rightarrow 1$
  - $81\text{h} - 140\text{h} \rightarrow 2$
  - $141\text{h} - 200\text{h} \rightarrow 3$
  - $201\text{h} - 300\text{h} \rightarrow 5$
  - $> 300\text{h} \rightarrow 8$

---

## 3. Priorização Consolidada (Tabela WSJF)

| Feature | Descrição | Valor | ROI | Crit. | Risco | CoD | Viab. | Horas | Fonte | JobSize | Score | Rank | Fase | Deps | Quick-Win |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F-03** | Barramento Consentimento & Privacy LGPD | 8 | 5 | 13 | 13 | 9.10 | Alta (1.0) | 80h | estimator | 1 | **9.10** | 1º | — | **Sim** |
| **F-04** | API Gateway B2B Rest/OAuth2/mTLS | 13 | 8 | 8 | 8 | 9.50 | Alta (1.0) | 120h | estimator | 2 | **4.75** | 2º | — | **Sim** |
| **F-02** | Motor Executor de Regras de Crédito | 13 | 13 | 13 | 8 | 11.75 | Alta (1.0) | 200h | estimator | 3 | **3.92** | 3º | F-01 | Não |
| **F-07** | Trilha de Auditoria Imutável (Audit Trail) | 8 | 3 | 8 | 13 | 7.75 | Alta (1.0) | 120h | estimator | 2 | **3.88** | 4º | F-02 | Não |
| **F-01** | Engine Ingestão Tempo Real Bureau | 13 | 8 | 13 | 13 | 11.50 | Alta (1.0) | 160h | estimator | 3 | **3.83** | 5º | — | Não |
| **F-08** | Pipeline CI/CD Multi-AZ Kubernetes | 8 | 5 | 8 | 8 | 7.10 | Alta (1.0) | 140h | estimator | 2 | **3.55** | 6º | — | Não |
| **F-06** | Painel B2B Monitoramento & Consumo | 8 | 8 | 5 | 5 | 6.80 | Alta (1.0) | 100h | estimator | 2 | **3.40** | 7º | F-04 | **Sim** |
| **F-10** | Módulo Resolução Disputas Cad. Positivo | 5 | 3 | 8 | 8 | 5.60 | Alta (1.0) | 100h | estimator | 2 | **2.80** | 8º | F-03 | Não |
| **F-05** | Autenticação Biométrica & Fingerprint | 8 | 8 | 8 | 13 | 9.25 | Média (0.8) | 160h | estimator | 3 | **2.47** | 9º | F-04 | Não |
| **F-09** | Modelo Preditivo Score Comportamental V1 | 13 | 13 | 5 | 5 | 9.80 | Média (0.8) | 240h | estimator | 5 | **1.57** | 10º | F-01, F-02 | Não |
| **F-13** | Portal Self-Service Developer & Sandbox | 5 | 8 | 3 | 3 | 5.10 | Alta (1.0) | 120h | estimator | 2 | **2.55** | 11º | F-04 | Não |
| **F-16** | Módulo Relatórios ESG & Governança | 5 | 3 | 5 | 5 | 4.40 | Alta (1.0) | 100h | estimator | 2 | **2.20** | 12º | F-07 | Não |
| **F-17** | Observabilidade Tracing OpenTelemetry | 5 | 3 | 5 | 5 | 4.40 | Alta (1.0) | 100h | estimator | 2 | **2.20** | 13º | F-08 | Não |
| **F-15** | Alertas Deterioração Crédito (Early Warning)| 8 | 5 | 5 | 5 | 5.90 | Alta (1.0) | 140h | estimator | 3 | **1.97** | 14º | F-02 | Não |
| **F-11** | Recálculo Dinâmico Limite de Crédito | 8 | 8 | 5 | 5 | 6.80 | Média (0.8) | 180h | estimator | 3 | **1.81** | 15º | F-02, F-09 | Não |
| **F-12** | Conector Open Finance (Extrato Bancário) | 13 | 8 | 5 | 8 | 8.55 | Média (0.8) | 220h | estimator | 5 | **1.37** | 16º | F-01, F-03 | Não |
| **F-14** | Engine Detecção Fraude Sintética | 8 | 8 | 5 | 8 | 7.55 | Baixa (0.6) | 200h | estimator | 5 | **0.91** | 17º | F-05, F-09 | Não |
| **F-22** | Webhooks Notificação Alteração Score | 5 | 5 | 3 | 3 | 4.20 | Alta (1.0) | 80h | estimator | 1 | **4.20** | 18º | F-04, F-02 | Não |
| **F-18** | Analytics Preditivo Churn Concessão | 5 | 5 | 3 | 3 | 4.20 | Média (0.8) | 160h | estimator | 3 | **1.12** | 19º | F-09 | Não |
| **F-20** | Simulação Portfólio Estresse (Stress Test)| 5 | 3 | 3 | 5 | 4.10 | Média (0.8) | 180h | estimator | 3 | **1.09** | 20º | F-02, F-09 | Não |
| **F-19** | Motor Cross-Sell Produtos Financeiros | 8 | 8 | 3 | 3 | 6.00 | Baixa (0.6) | 200h | estimator | 5 | **0.72** | 21º | F-11 | Não |
| **F-21** | Conector Criptoativos & Análise Patrimonial| 3 | 3 | 2 | 5 | 3.35 | Baixa (0.6) | 160h | estimator | 3 | **0.67** | 22º | F-01 | Não |
| **F-23** | Scoring Social & Scraping Redes Sociais | 3 | 2 | 1 | 8 | 3.65 | M.Baixa (0.5)| 240h | estimator | 8 | **0.23** | 23º | — | Não |
| **F-24** | Smart Contracts Blockchain Pública | 2 | 1 | 1 | 8 | 2.35 | M.Baixa (0.5)| 300h | estimator | 8 | **0.15** | 24º | — | Não |

---

## 4. Estratégia do MVP & Hipótese de Valor

### Hipótese Principal de Valor
> **SE** disponibilizarmos um motor unificado de ingestão de dados Bureau Equifax/BoaVista (F-01) integrado a um motor de regras de alta velocidade (F-02), garantido por barramento de privacidade LGPD (F-03), autenticação biométrica (F-05) e API Gateway de alta disponibilidade (F-04) em até 3 meses,  
> **ENTÃO** reduziremos a latência média de consulta de crédito B2B de 4,0s para menos de 300ms e elevaremos a precisão do score preditivo em 18%,  
> **MEDIDO POR** onboarding bem-sucedido de 15 novos clientes corporativos Tier-1 e processamento de ao menos 2.000.000 de consultas nos primeiros 60 dias de operação pós-Go-Live.

### Capacidade & Alocação do MVP
- **Capacidade Útil Disponível:** 3 Squads $\times$ 3 Sprints $\times$ 160h/dev = **1.440 horas líquidas**.
- **Esforço Total do Escopo MVP (F-01 a F-10):** **1.420 horas** + 20h de buffer de contingência = **1.440 horas**.
- **Taxa de Utilização de Capacidade:** **100%**.

### Métricas SMART de Sucesso
1. **Latência P99:** Tempo total de resposta do API Gateway e processamento do Score $\le 300\text{ms}$ em $99,5\%$ das chamadas.
2. **Poder Discriminatório (Gini):** Aumento do índice Gini do score de risco de $0,42$ para $> 0,52$.
3. **Adoção B2B:** Onboarding formal de $15$ grandes contas corporativas até a Sprint 6.
4. **Conformidade LGPD:** $100\%$ das consultas com opt-in/consentimento rastreável na trilha imutável.
5. **SLA do Barramento:** Disponibilidade de $99,99\%$ sem degradação em picos de até $5.000\text{ TPS}$.

### Critério Go / No-Go para Liberação da Fase 2
- **Aprovação Automática (Go):** Cumprimento simultâneo da latência P99 $< 300\text{ms}$, conversão B2B $> 20\%$ e zero incidentes críticos de segurança/LGPD nas primeiras 4 semanas pós-MVP.

### Tabela de Exceções & Auditoria
| Item / Feature | Posição Original | Posição Final | Motivo da Decisão | Aprovador |
| :--- | :---: | :---: | :--- | :--- |
| **F-03 (Consentimento LGPD)** | 1º (Score 9.10) | 1º (MVP) | Mantida no topo por ser o habilitador legal indispensável de toda a plataforma. | Comitê DPO & Legal |
| **F-09 (Score Comportamental)** | 10º (Score 1.57) | 10º (MVP) | Incluída no MVP para fechar a entrega de valor do motor preditivo unificado, preenchendo a capacidade exata do MVP. | Chief Product Officer |

---

## 5. Roadmap de Fases & Mapa de Dependências

### Estrutura de Fases

#### Fase 1: MVP (Meses 1–3) — Core Platform & Foundation
- **Escopo (10 Features):** F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08, F-09, F-10.
- **Esforço:** 1.420h.
- **Objetivo:** Estabelecer o motor unificado, infraestrutura cloud segura e conformidade legal total.

#### Fase 2: Escala, Analytics Avançado & Open Finance (Meses 4–6)
- **Escopo (7 Features):** F-11, F-12, F-13, F-14, F-15, F-16, F-17.
- **Esforço:** 1.060h.
- **Objetivo:** Ampliar fontes de dados com Open Finance, adicionar inteligência antifraude sintética e recursos de self-service.

#### Fase 3: Expansão & Inovação B2B (Meses 7–9)
- **Escopo (5 Features):** F-18, F-19, F-20, F-21, F-22.
- **Esforço:** 720h.
- **Objetivo:** Automatizar ofertas de cross-sell, simulação de portfólio de estresse e suporte a ativos alternativos.

#### Parking Lot (Aguardando Viabilidade / Validação)
- **Escopo (2 Features):** F-23 (Scoring Social), F-24 (Smart Contracts Blockchain).
- **Esforço:** 540h.
- **Motivo:** Elevado risco regulatório (LGPD) e viabilidade técnica limitada no momento atual.

---

### Mapa de Dependências Inter-Fases

```
[F-01 Ingestão Bureau] ────► [F-02 Score Engine] ────► [F-07 Audit Trail]
         │                            │
         ├────────────────────────┐   ├────────────────────► [F-09 ML Model V1]
         ▼                        ▼   ▼                             │
[F-12 Open Finance]       [F-11 Recálculo Limites] ◄────────────────┘
                                  │
                                  ▼
                         [F-19 Cross-Sell Motor]

[F-03 LGPD Privacy] ──────► [F-10 Disputas Positivo]

[F-04 API Gateway] ───────► [F-05 Biometria Fingerprint]
         │
         ├────────────────► [F-06 Painel B2B Consumo]
         ├────────────────► [F-13 Sandbox Developer]
         └────────────────► [F-22 Webhooks Score]

[F-08 Infra K8s Multi-AZ] ─► [F-17 Observabilidade OpenTelemetry]
```

---

## 6. Premissas, Riscos & Matriz de Mitigação

| ID | Descrição do Risco | Prob. | Impacto | P x I | Estratégia de Mitigação | Responsável |
| :-: | :--- | :-: | :-: | :-: | :--- | :--- |
| **R-01** | Indisponibilidade ou alta latência nas APIs legadas dos Bureaus originais. | Média (3) | Alto (4) | **12** | Implementar camada de cache distribuído Redis com fallback gracioso para dados cadastrais em contingência. | Tech Lead Infra |
| **R-02** | Mudanças regulatórias súbitas pela ANPD/BACEN sobre o Cadastro Positivo. | Baixa (2) | Alto (5) | **10** | Arquitetura modular desacoplada do barramento LGPD (F-03), permitindo adequação de regras em horas sem refatoração do core. | DPO / Compliance |
| **R-03** | Gargalo na validação dos modelos preditivos de ML por escassez de massa de dados históricos unificados. | Média (3) | Médio (3)| **9** | Execução antecipada de POCS de engenharia de dados durante o primeiro ciclo da Sprint 1. | Lead Data Scientist |
| **R-04** | Degradação de performance do API Gateway durante picos de consulta B2B simultâneas. | Baixa (2) | Alto (4) | **8** | Configuração de auto-scaling horizontal no Kubernetes Multi-AZ e testes de carga contínuos (Chaos Engineering). | DevOps Lead |

---
> **Roadmapper V2 | Foursys** — Documento oficial de consolidação arquitetural e estratégia de produto.  
> Data de Emissão: 02/03/2025 | Versão: 2.0 Final Consolidada.
