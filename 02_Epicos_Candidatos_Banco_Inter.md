# The Visionary — 02. Brainstorm de Épicos — Banco Inter
Etapa 02/06 · v1.0.0 · Julho 2026 · Banco Inter

## 1. Sumário Executivo
> Com base no diagnóstico de descobertas realizado na Etapa 01 (arquivo `01_Descoberta_Banco_Inter.md`), este documento consolida o resultado do brainstorming estratégico para a estruturação da **Plataforma Global de FX do Banco Inter**. A partir das dores cruciais e oportunidades de expansão mapeadas, concebemos **6 Épicos Candidatos** estruturados de forma orientada a valor. Cada épico foi projetado para atacar diretamente as ineficiências identificadas e impulsionar objetivos tangíveis de ROI, preparando o Banco Inter para eliminar latências cambiais, mitigar custos de correspondência bancária e garantir uma experiência transfronteiriça com SLAs abaixo de 5 segundos.

## 2. Sessão de Brainstorming
Esta seção registra as ideias brutas capturadas durante a sessão de cocriação e brainstorming "Como poderíamos...", agrupadas em torno de cada dor/oportunidade de origem ("sementes de épico" da Etapa 01):

### Dor 01: Fricção no ponto de venda devido a atrasos de validação de saldo e conversão na rede internacional de cartões
* **Ideia 1.1:** Criar um pré-autorizador de cartões local que consiga ler informações de saldo multimoeda em cache de alta velocidade para responder em <1s.
* **Ideia 1.2:** Desenvolver um motor dinâmico de conversão rápida integrado com as cotações do dia para liquidar imediatamente no ponto de venda.
* **Ideia 1.3:** Habilitar uma carteira inteligente que busque saldos de fallback automaticamente (se não houver dólar suficiente, debitar em Euro ou Real com conversão instantânea).

### Dor 02: Conexão complexa e assíncrona entre mensageria legada (BR) e o Core banking americano moderno (Finxact)
* **Ideia 2.1:** Implementar um barramento de eventos de alta velocidade para desacoplar as requisições síncronas brasileiras dos processamentos assíncronas do Finxact.
* **Ideia 2.2:** Desenvolver uma API de compensação que gerencie travas e reservas de saldos temporários (*Holds*) e postagens definitivas (*Posts*) em ambos os sistemas.
* **Ideia 2.3:** Criar um motor de concorrência que garanta que transações concorrentes na mesma conta não gerem saldos negativos.

### Dor 03: Gargalo no processamento de AML/KYC transacional durante fluxos críticos em tempo real
* **Ideia 3.1:** Executar regras de AML/KYC de forma paralela via microsserviço assíncrono baseado em eventos, sem interromper o fluxo principal se a pontuação for de baixo risco.
* **Ideia 3.2:** Desenvolver listas negras locais cacheadas em memória (Redis) atualizadas periodicamente de forma a reduzir chamadas externas de API lentas a milissegundos.
* **Ideia 3.3:** Criar uma mesa operacional de compliance em tempo real ("fast-track") com alertas push automáticos para analistas quando a pontuação exigir intervenção.

### Oportunidade 04: Orquestração centralizada de transações multi-geográficas baseada em máquinas de estado
* **Ideia 4.1:** Desenvolver um motor de orquestração distribuída (padrão SAGA) para rastrear e gerenciar o ciclo de vida completo de cada transação de câmbio multi-geográfica.
* **Ideia 4.2:** Implementar rotinas de compensação automática (rollback lógico) para desfazer lançamentos caso um dos passos da transação falhe (ex.: débito no BR com erro de crédito nos EUA).
* **Ideia 4.3:** Criar uma console operacional de auditoria visual onde a equipe possa enxergar os estados das transações em voo e intervir se houver travamentos.

### Oportunidade 05: Integração de um gateway global de payouts (Tazapay) de baixo custo
* **Ideia 5.1:** Conectar diretamente o barramento de câmbio à API do Tazapay para liquidação de transferências de baixo custo na Europa (trilho SEPA).
* **Ideia 5.2:** Implementar um roteador de liquidez que busque a cotação mais favorável entre Tazapay e outros provedores de FX em tempo real.
* **Ideia 5.3:** Desenvolver processos automáticos de envio em lote de transações para reconciliação e fechamento cambial ao fim do dia.

### Oportunidade 06: Unificação do motor de remessas internas garantindo transações ACID entre Core BR e Core EUA
* **Ideia 6.1:** Desenvolver um motor unificado de remessas internas que realize a conversão e transferência de saldos com transacionalidade garantida (ACID) entre contas de mesma titularidade.
* **Ideia 6.2:** Integrar o cálculo de impostos (IOF e spread cambial dinâmico) de maneira nativa e parametrizável antes do processamento da remessa.
* **Ideia 6.3:** Implementar geração automatizada de contratos de câmbio regulatórios simplificados integrados ao Banco Central do Brasil.

## 3. Épicos Candidatos
Abaixo está a tabela consolidada de Épicos Candidatos, mapeando cada iniciativa aos seus objetivos estratégicos de ROI e sua rastreabilidade com os insumos da etapa anterior.

| # | Nome do Épico | Elevator Pitch (Resumo de Valor) | Objetivos de ROI | Origem (Semente de Épico) |
|:-:|:---|:---|:---|:---|
| **EP-01** | **Orquestrador Global de Transações (FX Orchestrator)** | Máquina de estados distribuída (SAGA pattern) para gerenciar e reconciliar transações financeiras multi-geográficas de forma consistente e com zero perdas de saldo. | 9, 11, 10, 12 | Oportunidade (Orquestração SAGA) |
| **EP-02** | **Trânsito Automatizado Finxact (Finxact Automated Transit)** | Barramento assíncrono de integração entre a mensageria regulatória brasileira e o core banking americano Finxact, mitigando concorrência de saldos. | 9, 11, 4, 16 | Dor (Conexão Assíncrona BR/EUA) |
| **EP-03** | **Integração de Gateway de Payout Tazapay** | Integração com o ecossistema Tazapay para liquidação local na Europa (trilhos SEPA) e outras moedas sem depender de múltiplos bancos correspondentes. | 1, 8, 12, 15 | Oportunidade (Tazapay) |
| **EP-04** | **Motor de Remessas Internas Instantâneas** | Motor transacional para transferências instantâneas ACID entre contas BR e EUA de mesma titularidade, automatizando impostos (IOF) e spread em tempo real. | 1, 7, 6, 13 | Oportunidade (Remessa Interna ACID) |
| **EP-05** | **Motor de Compliance de AML em Tempo Real** | Triagem de conformidade de AML e KYC baseada em eventos, processando listas de sanções em milissegundos sem adicionar latência perceptível no fluxo cambial. | 10, 14, 20, 9 | Dor (Gargalo AML/KYC) |
| **EP-06** | **Cartão Multimoedas Inteligente (Seamless FX Smart Wallet)** | Lógica inteligente para autorização instantânea e conversão de câmbio sob demanda no ponto de venda, com validações de cache e latência menor que 5s. | 6, 1, 2, 13 | Dor (Atrasos no Ponto de Venda) |

## 4. Detalhe por Épico

### EP-01: Orquestrador Global de Transações (FX Orchestrator)
* **Elevator Pitch:** Máquina de estados distribuída (SAGA pattern) para gerenciar e reconciliar transações financeiras multi-geográficas de forma consistente e com zero perdas de saldo.
* **Entregas Principais:**
  - Engine central de orquestração assíncrona baseada em AWS Step Functions ou Camunda.
  - Mecanismo de rollback lógico automatizado (ações de compensação como estornos e cancelamentos).
  - Rastreabilidade de transações ponta a ponta com IDs unificados e logs persistentes.
  - Painel visual de monitoramento operacional de transações ativas e tratativas de falhas.
* **Objetivos de ROI Mapeados:**
  - *Primários:* 9. Eficiência operacional · 11. Otimização de fluxos de trabalho
  - *Secundários:* 10. Aumento de controle ou monitoramento · 12. Reduzir custo operacional
* **Dor/Oportunidade de Origem:** Oportunidade - Orquestração centralizada de transações multi-geográficas baseada em máquinas de estado.

### EP-02: Trânsito Automatizado Finxact (Finxact Automated Transit)
* **Elevator Pitch:** Barramento assíncrono de integração entre a mensageria regulatória brasileira e o core banking americano Finxact, mitigando concorrência de saldos.
* **Entregas Principais:**
  - Pipeline de mensageria assíncrona robusto usando Apache Kafka para desacoplar barramentos síncronos.
  - Mecanismo de hold temporário de saldo (Hold) e postagem definitiva (Post) coordenado com o Core Finxact.
  - Motor de reconciliação automática de sub-ledgers multi-moeda e detecção de anomalias diárias.
  - Implementação de Circuit Breakers e técnicas de backpressure para proteção dos sistemas de core.
* **Objetivos de ROI Mapeados:**
  - *Primários:* 9. Eficiência operacional · 11. Otimização de fluxos de trabalho
  - *Secundários:* 4. Acelerar o tempo de lançamento · 16. Reduzir custo de mão de obra
* **Dor/Oportunidade de Origem:** Dor - Conexão complexa e assíncrona entre mensageria legada (BR) e o Core banking americano moderno (Finxact).

### EP-03: Integração de Gateway de Payout Tazapay
* **Elevator Pitch:** Integração com o ecossistema Tazapay para liquidação local na Europa (trilhos SEPA) e outras moedas sem depender de múltiplos bancos correspondentes.
* **Entregas Principais:**
  - Conectores de APIs de FX Rates e booking de taxas de câmbio em tempo real com o Tazapay.
  - Motor de roteamento de payouts estruturado para os trilhos europeus SEPA e transferências internacionais locais.
  - Subsistema de fallback automático para processadores secundários de liquidez global.
  - Painel financeiro de consolidação diária e fechamento de câmbio regulatório em lotes.
* **Objetivos de ROI Mapeados:**
  - *Primários:* 1. Aumentar a receita · 8. Acesso a novos mercados
  - *Secundários:* 12. Reduzir custo operacional · 15. Reduzir preços (produtos ou serviços)
* **Dor/Oportunidade de Origem:** Oportunidade - Integração de um gateway global de payouts (Tazapay) de baixo custo.

### EP-04: Motor de Remessas Internas Instantâneas
* **Elevator Pitch:** Motor transacional para transferências instantâneas ACID entre contas BR e EUA de mesma titularidade, automatizando impostos (IOF) e spread em tempo real.
* **Entregas Principais:**
  - Motor de cálculo dinâmico de IOF, Spread Cambial e tarifas operacionais parametrizáveis por tipo de cliente.
  - API transacional ACID de transferência imediata de fundos próprios inter-cores.
  - Integração de geração automática de contratos de câmbio regulatórios (BACEN/e-Financeira).
  - Fluxo de UX/UI unificado no app para simulação de envio, cotação garantida por X segundos e confirmação rápida.
* **Objetivos de ROI Mapeados:**
  - *Primários:* 1. Aumentar a receita · 7. Impulsionar produto ou serviço
  - *Secundários:* 6. Fidelização de clientes · 13. Aumentar a base de clientes
* **Dor/Oportunidade de Origem:** Oportunidade - Unificação do motor de remessas internas garantindo transações ACID entre Core BR e Core EUA.

### EP-05: Motor de Compliance de AML em Tempo Real
* **Elevator Pitch:** Triagem de conformidade de AML e KYC baseada em eventos, processando listas de sanções em milissegundos sem adicionar latência perceptível no fluxo cambial.
* **Entregas Principais:**
  - Motor de triagem assíncrono em alta performance rodando em paralelo ao processamento da transação financeira.
  - Estrutura de cache em memória (Redis) para busca ultra-rápida de listas PEP (Pessoas Expostas Politicamente) e OFAC.
  - Barramento de eventos para acionamento de workflows manuais de compliance (fast-track case management).
  - Integração em tempo real com agências de enriquecimento cadastral global (IDology/Dow Jones).
* **Objetivos de ROI Mapeados:**
  - *Primários:* 10. Aumento de controle ou monitoramento · 14. Evitar perdas (churn/turnover)
  - *Secundários:* 20. Redução de custos administrativos · 9. Eficiência operacional
* **Dor/Oportunidade de Origem:** Dor - Gargalo no processamento de AML/KYC transacional durante fluxos críticos em tempo real.

### EP-06: Cartão Multimoedas Inteligente (Seamless FX Smart Wallet)
* **Elevator Pitch:** Lógica inteligente para autorização instantânea e conversão de câmbio sob demanda no ponto de venda, com validações de cache e latência menor que 5s.
* **Entregas Principais:**
  - Motor de decisão para processamento de transações de débito internacional (Core EUA - Finxact).
  - Mecanismo de autorização inteligente em cache que consome saldos multi-moeda (USD -> EUR -> fallback para BRL).
  - Integração com redes internacionais de processamento de cartões (Mastercard/Visa) via APIs de baixa latência.
  - Central de configurações do cartão multimoeda direto no app Banco Inter (bloqueio, limites, prioridade de moedas).
* **Objetivos de ROI Mapeados:**
  - *Primários:* 6. Fidelização de clientes · 1. Aumentar a receita
  - *Secundários:* 2. Alavancagem da marca · 13. Aumentar a base de clientes
* **Dor/Oportunidade de Origem:** Dor - Fricção no ponto de venda devido a atrasos de validação de saldo e conversão na rede internacional de cartões.

## 5. Matriz de Objetivos Utilizada
Abaixo está consolidada a Matriz de Objetivos de ROI do Banco Inter, destacando em **negrito** e com sinalizador (*Ativo*) os objetivos estratégicos selecionados para os Épicos Candidatos desta plataforma:

| Categoria | Objetivos |
|:---|:---|
| **Receita** (alta prioridade) | - **[Ativo] 1. Aumentar a receita** *(EP-03, EP-04, EP-06)*<br>- **[Ativo] 2. Alavancagem da marca** *(EP-06)*<br>- 3. Impulsionar renome/case<br>- **[Ativo] 4. Acelerar o tempo de lançamento** *(EP-02)* |
| **Crescimento** (alta prioridade) | - 5. Aumentar rentabilidade<br>- **[Ativo] 6. Fidelização de clientes** *(EP-04, EP-06)*<br>- **[Ativo] 7. Impulsionar produto ou serviço** *(EP-04)*<br>- **[Ativo] 8. Acesso a novos mercados** *(EP-03)* |
| **Eficiência** (média prioridade) | - **[Ativo] 9. Eficiência operacional** *(EP-01, EP-02, EP-05)*<br>- **[Ativo] 10. Aumento de controle ou monitoramento** *(EP-01, EP-05)*<br>- **[Ativo] 11. Otimização de fluxos de trabalho** *(EP-01, EP-02)*<br>- **[Ativo] 12. Reduzir custo operacional** *(EP-01, EP-03)* |
| **Retenção** (alta prioridade) | - **[Ativo] 13. Aumentar a base de clientes** *(EP-04, EP-06)*<br>- **[Ativo] 14. Evitar perdas (churn/turnover)** *(EP-05)*<br>- **[Ativo] 15. Reduzir preços (produtos ou serviços)** *(EP-03)*<br>- **[Ativo] 16. Reduzir custo de mão de obra** *(EP-02)* |
| **Inovação** (média prioridade) | - 17. Novos produtos ou serviços<br>- 18. Inovação para os clientes<br>- 19. Produzir solução disruptiva<br>- **[Ativo] 20. Redução de custos administrativos** *(EP-05)* |

## 6. Insumos para as Etapas 03 e 04
Para direcionar o trabalho subsequente nas próximas etapas do fluxo **The Visionary**, os seguintes direcionamentos estratégicos foram acordados:

### Insumos de Benchmark de Mercado (Etapa 03):
* **EP-03 (Gateway Tazapay):** Pesquisar benchmarks de integração e modelos de pricing do Tazapay comparado com outros facilitadores de payout global como dLocal e EBANX. Investigar tempos de liquidação de trilhos SEPA nesses provedores.
* **EP-06 (Cartão Multimoedas):** Mapear a experiência de autorização de compras internacionais da Wise, Nomad e C6 Global. Analisar como realizam a validação em tempo real e a seleção inteligente de moedas em cache de borda.
* **EP-01 (Orquestrador SAGA):** Investigar como grandes fintechs internacionais estruturam seus motores de reconciliação e orquestradores de transações assíncronas transfronteiriças.

### Hipóteses de Valor e Quantificação de ROI (Etapa 04):
* **Redução de Custo de Correspondência:** Ao eliminar múltiplos bancos correspondentes tradicionais e migrar para payouts locais (Tazapay/SEPA), projeta-se uma economia de **$2.50 a $5.00** por transação de envio para a Europa.
* **Mitigação de Churn por Fricção de Compra:** Estima-se que a diminuição dos timeouts de compra no ponto de venda de 4.5% para menos de 0.1% recupere aproximadamente **$1.2M** anuais em volume transacional retido.
* **Eficiência na Liberação de Compliance:** A triagem assíncrona em milissegundos com cache local (Redis) deve reduzir a incidência de transações enviadas para análise manual em **70%**, otimizando o custo operacional da equipe de compliance (redução de OpEx de backoffice).

---
_Documento elaborado com a skill 02 — Brainstorm de Épicos · The Visionary · UpStream Foursys_