# The Visionary — 01. Descoberta Inicial — Banco Inter
Etapa 01/06 · v1.0.0 · Julho 2026 · Banco Inter

## 1. Sumário Executivo
> A Plataforma Global de FX representa um marco de expansão internacional de varejo estratégico para o Banco Inter, unificando a remessa de fundos e integrando o Core Brasil ao Core EUA (Finxact) em tempo real. O objetivo principal é eliminar a latência e os custos operacionais da rede de correspondentes tradicionais por meio de fluxos automatizados e integrados. Ao conectar as pontas transacionais com resiliência, conformidade rigorosa e SLAs de ultra-baixa latência (abaixo de 5 segundos), o Banco Inter se consolidará no competitivo ecossistema global de varejo de câmbio digital.

## 2. Contexto do Negócio
O Banco Inter tem como meta estratégica consolidar sua liderança e pioneirismo no mercado de varejo bancário global, oferecendo uma experiência financeira multimoedas e transfronteiriça verdadeiramente nativa para seus mais de 30 milhões de clientes. No cenário econômico atual, o mercado de câmbio de varejo é marcado por altas tarifas, burocracia excessiva e atrasos no processamento gerados por redes legadas de correspondência bancária (Swift tradicional).

Com a expansão da Conta Global, o Banco Inter pretende não apenas oferecer saldo em dólar (USD), mas também estender seus trilhos de pagamento a novos mercados e moedas (como Euro via trilhos SEPA), conectando-se diretamente a gateways de pagamento internacionais eficientes e reduzindo ao máximo a dependência de intermediários financeiros para baixar seu custo de serviço.

## 3. Problema Principal
Atualmente, as transações transfronteiriças de câmbio de varejo de ponta a ponta sofrem com:
* **Alto Tempo de Resposta (Latência Cambial):** Fricções na validação e liquidação geram frustração no ponto de venda quando correntistas utilizam cartões de débito internacionais.
* **Complexidade Operacional de Integração:** Interligar sistemas de mensageria financeira brasileira herdada (BACEN) de natureza síncrona com os modernos sistemas core na nuvem dos EUA (Finxact) que funcionam de forma assíncrona.
* **Sobrecarga de Compliance em Tempo Real:** Realizar análises mandatórias de AML (Anti-Money Laundering) de forma instantânea sem causar impacto perceptível na experiência ou no tempo total de liquidação de transações instantâneas.

## 4. Usuários e Clientes
* **Correntistas de Varejo (Viajantes e Consumidores Globais):** Clientes pessoa física que realizam viagens internacionais, compram em e-commerce estrangeiro e buscam um cartão multimoeda com taxas competitivas e de uso imediato.
* **Investidores Globais e Expatriados:** Clientes que movimentam recursos entre contas de diferentes geografias e buscam previsibilidade, tarifas amigáveis de spread cambial e transações ágeis.
* **Pequenos e Médios Importadores/Exportadores (PME Globais):** Empresas que precisam efetuar pagamentos e receber recursos do exterior rapidamente sem custos exorbitantes de contratos de câmbio tradicionais.

## 5. Objetivos Estratégicos (Próximos 12–24 meses)
1. **SLA de Latência Extrema:** Responder às transações de ponta a ponta (autorização e câmbio) em menos de **5 segundos** para pelo menos 99% das chamadas.
2. **Eficiência de Custo de Payout:** Eliminar intermediários através de consolidação direta e liquidação local no trilho europeu via rede SEPA por meio do gateway internacional de pagamentos Tazapay.
3. **Idempotência Absoluta das Transações:** Garantir zero ocorrências de cobrança dupla ou duplicações em transações mesmo sob graves oscilações de conectividade de rede móvel dos usuários.
4. **Alinhamento com Normas de AML/Compliance Internacionais:** Estabelecer um motor de compliance em tempo real em conformidade com as regras de vigilância do BACEN e do FinCEN dos EUA (como a *Travel Rule*).

## 6. Stakeholders
| Nome / Papel | Expectativa Principal | Influência |
| :--- | :--- | :--- |
| **Thiago Mendes**<br>_Sponsor / Diretor de Produtos Globais_ | Expansão internacional célere, atração de novos correntistas via competitividade tarifária e conversão instantânea. | Alta |
| **Mariana Silveira**<br>_Engineering Lead / VP de Arquitetura_ | Resiliência técnica do ecossistema, taxa de falhas zero, controle de concorrência refinado na nuvem AWS e estabilidade dos cores. | Alta |
| **Equipe de Compliance & Risk** | Triagem rigorosa de sanções (OFAC/PEP) e conformidade integral com regulamentações financeiras sem afetar o SLA. | Média |
| **Equipe de Operações Cambiais** | Automação completa dos fluxos de reconciliação de sub-ledgers multi-moeda e visibilidade instantânea dos fluxos de caixa. | Média |

## 7. Dores e Oportunidades
| Tipo | Descrição | Evidência | Semente de Épico? |
| :--- | :--- | :--- | :--- |
| **Dor** | Fricção no ponto de venda devido a atrasos de validação de saldo e conversão na rede internacional de cartões. | Clientes enfrentando timeouts de autorização em transações físicas com cartão multimoeda. | Sim (EP-06) |
| **Dor** | Conexão complexa e assíncrona entre mensageria legada (BR) e o Core banking americano moderno (Finxact). | Discrepâncias de concorrência e necessidade de mecanismos sofisticados de hold/post de saldos. | Sim (EP-02) |
| **Dor** | Gargalo no processamento de AML/KYC transacional durante fluxos críticos em tempo real. | Lentidão no fluxo cambial e aumento de transações sob análise manual desnecessária. | Sim (EP-05) |
| **Oportunidade** | Orquestração centralizada de transações multi-geográficas baseada em máquinas de estado. | Redução de estados inconsistentes em caso de falha de conexão na liquidação (SAGA pattern). | Sim (EP-01) |
| **Oportunidade** | Integração de um gateway global de payouts (Tazapay) de baixo custo. | Acesso direto a trilhos de pagamentos eficientes (SEPA na Europa) sem passar por múltiplos bancos correspondentes. | Sim (EP-03) |
| **Oportunidade** | Unificação do motor de remessas internas garantindo transações ACID entre Core BR e Core EUA. | Agilização do fluxo de transferência de fundos próprios do correntista com conformidade tributária (IOF). | Sim (EP-04) |

## 8. Custo da Inação
Caso a nova Plataforma de FX não seja implementada, o Banco Inter sofrerá as seguintes consequências:
* **Perda de Competitividade:** Clientes migrarão para concorrentes digitais focados (como Wise e Nomad) ou novos bancos de varejo nacionais com estruturas globais mais maduras (como C6 Global).
* **Altas Despesas Operacionais (OpEx):** Continuidade no pagamento de taxas elevadas e spreads desvantajosos aos bancos correspondentes intermediários.
* **Risco de Integridade de Dados e Custos Financeiros:** Falha na idempotência de transações gerando débitos indevidos duplicados, reclamações de clientes nos canais de atendimento e custos logísticos de estorno manual de divisas.
* **Gargalo no Crescimento Internacional:** Impossibilidade de escalar a base para moedas além do dólar devido às restrições arquiteturais herdadas.

## 9. Insumos para a Etapa 02
Com base na descoberta inicial, o Brainstorm de Épicos (Etapa 02) deve focar na especificação e decomposição das seguintes soluções prioritárias:
1. **Orquestração de Transações Complexas:** Necessidade de um mecanismo de compensação e resiliência transacional automatizado (FX Orchestrator).
2. **Conexão Nativa de Cores (BR/EUA):** Integração segura e de alta performance com o core Finxact dos EUA e regras de sub-ledgers.
3. **Ponto de Entrada Internacional (Tazapay):** Uso de trilhos de payout locais e cotações de FX em tempo real.
4. **Motor Tributário e de Remessas:** Automação de impostos (IOF) e remessas internas instantâneas.
5. **Varredura Instantânea de Compliance (AML):** Integração de triagem transacional sem latência.
6. **Lógica Inteligente de Cartões Multimoedas:** Regras de autorização e seleção inteligente de saldos.

---
_Documento elaborado com a skill 01 — Descoberta Inicial · The Visionary · UpStream Foursys_
