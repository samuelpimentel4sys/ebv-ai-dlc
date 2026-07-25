# The Visionary — 04. Definição de ROI — Banco Inter
Etapa 04/06 · v1.0.0 · Julho 2026 · Banco Inter

## 1. Sumário Executivo

> **Análise Consolidada do Portfólio de FX:** 
> O programa estratégico para o desenvolvimento da **Plataforma Global de FX do Banco Inter** demanda um investimento inicial de capital consolidado de **$1.178.000 USD**. Sob projeções conservadoras, o portfólio atinge o ponto de equilíbrio (*break-even*) logo no início do segundo ano, acumulando **$1.077.200 USD** de retornos anuais recorrentes (91,4% de recuperação no primeiro ano). Sob a perspectiva otimista, o portfólio gera um retorno recorrente espetacular de **$3.962.500 USD/ano** a partir do primeiro ano, impulsionando a expansão de margens líquidas e do volume transacional.
> 
> * **Épico com Maior ROI Estimado:** **EP-04 (Motor de Remessas Internas Instantâneas)**, alcançando até **706,5% de ROI** no cenário otimista através da eliminação de abandonos de transação e atração de novos correntistas para a Conta Global.
> * **Épico com Payback Mais Rápido:** **EP-04 (Motor de Remessas Internas Instantâneas)** com **1,5 meses** de payback, seguido de perto pelo **EP-03 (Integração de Gateway de Payout Tazapay)** com **1,7 meses**, justificados pelo retorno financeiro imediato via economia direta e novas receitas transacionais.

---

## 2. Painel do Portfólio

Abaixo é apresentado o consolidado financeiro do portfólio de iniciativas que compõem a Plataforma Global de FX.

| Épico | Objetivos Primários | Investimento Inicial (USD) | Retorno Conservador (USD/ano) | Retorno Otimista (USD/ano) | ROI% (Conservador / Otimista) | Payback (Meses - Cons. / Ot.) | Status do Gate |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **EP-01:** FX Orchestrator | 9. Eficiência operacional<br>11. Otimização de fluxos | $145.000 | $90.000 | $227.500 | -37,9% / +56,9% | 19,3 m / 7,6 m | **Aprovado** (Estratégico) |
| **EP-02:** Trânsito Finxact | 9. Eficiência operacional<br>11. Otimização de fluxos | $249.000 | $150.000 | $300.000 | -39,7% / +20,5% | 19,9 m / 10,0 m | **Aprovado** (Estratégico) |
| **EP-03:** Gateway Tazapay | 1. Aumentar a receita<br>8. Novos mercados | $95.000 | $240.000 | $675.000 | +152,6% / +610,5% | 4,8 m / 1,7 m | **Aprovado** |
| **EP-04:** Remessas Internas | 1. Aumentar a receita<br>7. Impulsionar produto | $155.000 | $300.000 | $1.250.000 | +93,5% / +706,5% | 6,2 m / 1,5 m | **Aprovado** |
| **EP-05:** Compliance AML | 10. Controle e monitoramento<br>14. Evitar perdas (churn) | $151.000 | $90.000 | $330.000 | -40,4% / +118,5% | 20,1 m / 5,5 m | **Aprovado** (Estratégico) |
| **EP-06:** Cartão Multimoedas | 6. Fidelização de clientes<br>1. Aumentar a receita | $383.000 | $207.200 | $1.180.000 | -45,9% / +208,1% | 22,2 m / 3,9 m | **Aprovado** |
| **TOTAL** | **—** | **$1.178.000** | **$1.077.200** | **$3.962.500** | **-8,6% / +236,4%** | **13,1 m / 3,6 m** | **Aprovado** |

---

## 3. ROI Detalhado por Épico

### 3.1 EP-01: Orquestrador Global de Transações (FX Orchestrator)

#### 3.1.1 Objetivos de Negócio
* **Primários:** 
  * *9. Eficiência operacional:* Automatizar e orquestrar de ponta a ponta sem intervenções manuais.
  * *11. Otimização de fluxos de trabalho:* Eliminar redundâncias e monitorar transações em tempo real.
* **Secundários:**
  * *10. Aumento de controle ou monitoramento:* Rastreabilidade visual centralizada de transações multi-geográficas.
  * *12. Reduzir custo operacional:* Mitigação de estornos logísticos manuais por quebra de transações.
* **Meta Quantificada:** Reduzir transações pendentes/inconsistentes de 0,80% para menos de 0,02% do volume total transacionado dentro do primeiro ano de implantação.

#### 3.1.2 Investimento Esperado
| Componente | Detalhe do Investimento | Custo (USD) |
| :--- | :--- | :--- |
| **Pessoas** | Equipe de engenharia (1 Arquiteto, 2 Devs Sênior, 1 QA) × 4 meses (16 homem-mês × $8.000) | $128.000 |
| **Infraestrutura** | Setup de AWS Step Functions, CloudWatch, DynamoDB para retenção de logs e painel operacional | $12.000 |
| **Outros Custos** | Treinamento da equipe de operações de câmbio e licenças de monitoramento adicionais | $5.000 |
| **TOTAL** | **Investimento Inicial de Desenvolvimento do EP-01** | **$145.000** |

#### 3.1.3 Retorno Esperado
* **Retorno Qualitativo (Estratégico):** Idempotência absoluta nas transações. Reduz a perda de integridade de dados e evita atritos graves nos canais de ouvidoria/reclamações do SuperApp.
* **Retorno Financeiro Conservador:** Economia direta de **$90.000 USD/ano** (40% de redução nas perdas por falhas operacionais e estornos pendentes estimado em $150.000 USD/ano + redução de 1 FTE operacional de suporte avaliado em $30.000 USD/ano).
* **Retorno Financeiro Otimista:** Economia direta de **$227.500 USD/ano** (85% de redução em quebras operacionais de reconciliação que geram estornos caros ($127.500 USD) + liberação de 2 FTEs da equipe de ops de câmbio e suporte para novos produtos ($60.000 USD) + eliminação de taxas regulatórias por erros de envio ($40.000 USD)).
* **Memória de Cálculo:** Considera um volume total de 5 milhões de transações de câmbio anuais onde 0,80% sofrem anomalias de processamento de rede e sistemas concorrentes, gerando custos operacionais de reversão e atendimento estimados em $3,75 por incidente.

#### 3.1.4 Payback e ROI
```
Cenário Conservador:
ROI = ( $90.000 - $145.000 ) / $145.000 = -37,93%
Payback = ( $145.000 / $90.000 ) * 12 = 19,3 meses

Cenário Otimista:
ROI = ( $227.500 - $145.000 ) / $145.000 = +56,90%
Payback = ( $145.000 / $227.500 ) * 12 = 7,6 meses
```
**Conclusão:** O épico EP-01 se qualifica prioritariamente sob a perspectiva de resiliência e estabilidade arquitetural (estratégico). Embora apresente ROI negativo no primeiro ano do cenário conservador, ele se paga em menos de 8 meses no cenário de alta eficiência operacional, sendo indispensável para a integridade financeira geral da plataforma.

#### 3.1.5 Métricas de Sucesso
* **KPI 1:** Reduzir taxa de falhas de reconciliação de transações financeiras multi-geográficas de 0,80% para < 0,02% em 6 meses pós-lançamento.
* **KPI 2:** Redução do MTTR (tempo médio de reversão automática das falhas de sistema) de 4 horas para < 3 segundos usando rollback lógico estruturado.
* **KPI 3:** Eliminação de 100% dos débitos duplicados na conta corrente dos correntistas no SuperApp Banco Inter (idempotência absoluta de 100%).
* **KPI 4:** Diminuir chamados no suporte/ouvidoria relacionados a "erros de envio de câmbio" em pelo menos 90% no primeiro trimestre.

#### 3.1.6 Premissas e Riscos
* **Premissa 1:** A AWS Step Functions oferece throughput nativo acima de 150 transações por segundo (TPS) com latência imperceptível para o cliente final. *(Fonte: Benchmark de Arquitetura AWS e Soluções SAGA em Fintechs Globais).*
* **Premissa 2:** A equipe de Engenharia de Confiabilidade possui competência no padrão transacional assíncrono SAGA distribuído.
* **Risco de Engenharia:** Baixa familiaridade inicial com rollback lógico pode gerar atrasos no desenvolvimento (Risco Médio - mitigado via pareamento com arquitetos especialistas).
* **Risco Operacional:** Alterações abruptas em layouts de mensageria das pontas de envio podem quebrar contratos de transições de estado (Risco Baixo).

---

### 3.2 EP-02: Trânsito Automatizado Finxact (Finxact Automated Transit)

#### 3.2.1 Objetivos de Negócio
* **Primários:**
  * *9. Eficiência operacional:* Integrar de forma desacoplada barramentos síncronos legados com o core banking assíncrono americano.
  * *11. Otimização de fluxos de trabalho:* Substituição de processamentos lentos em batch por pipelines de tempo real.
* **Secundários:**
  * *4. Acelerar o tempo de lançamento:* Facilidade de estender novas funcionalidades cambiais sobre um barramento flexível de eventos.
  * *16. Reduzir custo de mão de obra:* Eliminação da depuração manual e remediação de anomalias diárias em arquivos batch.
* **Meta Quantificada:** Sincronizar dados de balanços e ordens em < 2 segundos com índice de discrepância de saldos igual a zero.

#### 3.2.2 Investimento Esperado
| Componente | Detalhe do Investimento | Custo (USD) |
| :--- | :--- | :--- |
| **Pessoas** | Equipe dedicada (1 Tech Lead, 3 Engenheiros Sênior, 1 QA) × 5 meses (25 homem-mês × $8.000) | $200.000 |
| **Infraestrutura** | Cluster Apache Kafka gerenciado via AWS MSK, além de ferramentas de telemetria corporativa | $24.000 |
| **Outros Custos** | Consultoria sênior de Core Banking americana para customização de ledger do Finxact | $25.000 |
| **TOTAL** | **Investimento Inicial de Desenvolvimento do EP-02** | **$249.000** |

#### 3.2.3 Retorno Esperado
* **Retorno Qualitativo (Estratégico):** Integração estável entre infraestruturas do Brasil e EUA, permitindo operações em tempo real sem concorrência de saldos ou riscos regulatórios cambiais entre geografias.
* **Retorno Financeiro Conservador:** Economia anual de **$150.000 USD/ano** com eliminação de multas contratuais e taxas de processamento fora do horário do batch ($40.000 USD) + economia em suporte técnico avançado de fechamento de ledger diário e horas extras de TI ($110.000 USD).
* **Retorno Financeiro Otimista:** Economia e otimização total de **$300.000 USD/ano** (redução drástica em OpEx de processamento de servidores por abandono do modelo ineficiente de polling síncrono ($100.000 USD) + eliminação de auditorias extras de reconciliação financeira ($120.000 USD) + ganho de produtividade acelerando novas APIs ($80.000 USD)).
* **Memória de Cálculo:** Baseado no custo atual de 80h/mês de engenharia de alta senioridade consumidas em depuração e tratamento manual de erros e inconsistências de saldos gerados por atrasos de mensageria síncrona/assíncrona de sub-ledgers.

#### 3.2.4 Payback e ROI
```
Cenário Conservador:
ROI = ( $150.000 - $249.000 ) / $249.000 = -39,76%
Payback = ( $249.000 / $150.000 ) * 12 = 19,9 meses

Cenário Otimista:
ROI = ( $300.000 - $249.000 ) / $249.000 = +20,48%
Payback = ( $249.000 / $300.000 ) * 12 = 10,0 meses
```
**Conclusão:** Trata-se de uma infraestrutura estruturante essencial. Embora os ganhos de ROI puramente monetários tenham prazo de maturação mais longo no cenário conservador, a substituição do processamento legador é obrigatória para a operação segura e regulatória da conta global, eliminando custos de inação de grande escala.

#### 3.2.5 Métricas de Sucesso
* **KPI 1:** Redução de 95% nos erros de integração de ledger e sub-ledger entre o ecossistema brasileiro e norte-americano (de 5.000 erros semanais para < 250).
* **KPI 2:** Sincronização de holds e posts em tempo real (< 2 segundos de latência em 99,9% das ordens de câmbio).
* **KPI 3:** Redução de 60% do custo de mão de obra direta (horas de analistas operacionais e desenvolvedores focados em suporte de ledger) em até 180 dias.
* **KPI 4:** Disponibilidade geral do barramento de eventos integrador fixado em 99,99% ao mês.

#### 3.2.6 Premissas e Riscos
* **Premissa 1:** As APIs nativas de holds temporários e posts definitivos do Core Banking Finxact dos EUA suportam chamadas de barramentos de mensageria em alto volume de concorrência. *(Fonte: Especificação Técnica e Documentação Oficial Finxact).*
* **Premissa 2:** Tolerância de falhas integrada com retry exponencial no processamento de mensagens.
* **Risco de Integração:** O time interno de Core do Banco Inter possui pouca familiaridade com o Kafka em tempo real, demandando apoio de especialistas (Risco Alto - mitigado com consultoria do parceiro local).
* **Risco de Latência:** Flutuações na rede de trânsito internacional (cabos transatlânticos de fibra) podem adicionar latência de rede superior ao SLA estipulado de 2s (Risco Médio - mitigado via fila de buffer assíncrona local).

---

### 3.3 EP-03: Integração de Gateway de Payout Tazapay

#### 3.3.1 Objetivos de Negócio
* **Primários:**
  * *1. Aumentar a receita:* Captura de novos mercados e novas transações de remessa.
  * *8. Acesso a novos mercados:* Conectividade direta com trilhos europeus SEPA e transferências internacionais locais.
* **Secundários:**
  * *12. Reduzir custo operacional:* Eliminação das taxas de processamento cobradas por intermediários e bancos correspondentes.
  * *15. Reduzir preços (produtos ou serviços):* Habilidade de precificar as transferências para clientes com spread altamente competitivo.
* **Meta Quantificada:** Expandir o volume total transacionado (TTV) na Europa em 35% e economizar de $2.50 a $5.00 por transação de envio de câmbio realizada.

#### 3.3.2 Investimento Esperado
| Componente | Detalhe do Investimento | Custo (USD) |
| :--- | :--- | :--- |
| **Pessoas** | Squad reduzida (3 Devs de Integração e APIs) × 3 meses (9 homem-mês × $8.000) | $72.000 |
| **Infraestrutura** | Recursos AWS de API Gateway, VPN Segura Dedicada e logs corporativos | $8.000 |
| **Outros Custos** | Custos tributários e de conformidade legal de setup com o provedor internacional | $15.000 |
| **TOTAL** | **Investimento Inicial de Desenvolvimento do EP-03** | **$95.000** |

#### 3.3.3 Retorno Esperado
* **Retorno Qualitativo (Estratégico):** Posiciona o Banco Inter como um verdadeiro player multimoedas nas geografias europeia e asiática, eliminando a dependência histórica de correspondentes tradicionais lentos (Swift).
* **Retorno Financeiro Conservador:** Economia operacional e novos spreads somando **$240.000 USD/ano** (baseado em economia de correspondente de $3,00 por transação em 80.000 remessas anuais estimadas).
* **Retorno Financeiro Otimista:** Economia total e novos negócios somando **$675.000 USD/ano** (economia média direta de correspondência bancária de $4,50 por remessa para 150.000 transações anuais estimuladas pela redução de tarifas e celeridade do envio).
* **Memória de Cálculo:** Taxa média de envio de correspondente tradicional de $6,50 por transação. O gateway Tazapay realiza liquidações de payouts locais (como o trilho SEPA na União Europeia) a um custo marginal de $2,00 por transação, reduzindo o custo por operação de envio em até 69%.

#### 3.3.4 Payback e ROI
```
Cenário Conservador:
ROI = ( $240.000 - $95.000 ) / $95.000 = +152,63%
Payback = ( $95.000 / $240.000 ) * 12 = 4,8 meses

Cenário Otimista:
ROI = ( $675.000 - $95.000 ) / $95.000 = +610,53%
Payback = ( $95.000 / $675.000 ) * 12 = 1,7 meses
```
**Conclusão:** O épico EP-03 possui um apelo financeiro imediato fortíssimo, apresentando alto retorno e payback extremamente rápido (abaixo de 5 meses) mesmo no cenário conservador. É uma iniciativa prioritária de alto impacto na margem bruta de FX.

#### 3.3.5 Métricas de Sucesso
* **KPI 1:** Redução do custo operacional unitário médio de remessas para a Europa de $6,50 para $2,00 em até 60 dias pós-lançamento.
* **KPI 2:** Reduzir o tempo de liquidação de transferências internacionais na Europa para < 2 horas em 95% dos envios (anteriormente D+1 ou D+2).
* **KPI 3:** Crescimento de 35% do Volume de Transações Transacionadas (TTV) direcionado à Europa no primeiro ano de funcionamento.
* **KPI 4:** Manter a taxa de rejeição de remessas nas pontas locais integradas ao Tazapay abaixo de 0,5%.

#### 3.3.6 Premissas e Riscos
* **Premissa 1:** O gateway Tazapay garante estabilidade contratual e SLAs de API e liquidez de câmbio concorrenciais. *(Fonte: Mapeamento de gateways globais dLocal, EBANX, Tazapay da Etapa 03).*
* **Premissa 2:** Trilhos de pagamento instantâneos locais (como SEPA Instant) mantêm liquidação imediata em moedas locais.
* **Risco Regulatório:** Mudanças em regras de remessa internacional na Europa que adicionem taxas sobre transferências de não-residentes (Risco Médio - mitigado via flexibilidade regulatória do parceiro).
* **Risco Cambial:** Variações intradiárias brutas de câmbio entre EUR e USD no momento do booking da taxa (Risco Baixo - mitigado via congelamento síncrono da taxa de câmbio por 15 segundos).

---

### 3.4 EP-04: Motor de Remessas Internas Instantâneas

#### 3.4.1 Objetivos de Negócio
* **Primários:**
  * *1. Aumentar a receita:* Monetização imediata de spreads cambiais e volume de remessas próprio.
  * *7. Impulsionar produto ou serviço:* Entrega de uma experiência fluida de envio instantâneo sem fricção.
* **Secundários:**
  * *6. Fidelização de clientes:* Reduzir a fuga de clientes para concorrentes focados como Wise e Nomad.
  * *13. Aumentar a base de clientes:* Atração orgânica de novos usuários através do marketing boca a boca pela velocidade do serviço.
* **Meta Quantificada:** Mitigar abandonos na simulação de remessas de 22% para menos de 5% e acelerar processamento ponta a ponta para < 5 segundos.

#### 3.4.2 Investimento Esperado
| Componente | Detalhe do Investimento | Custo (USD) |
| :--- | :--- | :--- |
| **Pessoas** | Squad multidisciplinar (1 UX/UI Designer, 2 Devs Backend, 1 Dev Mobile, 1 QA) × 4 meses | $128.000 |
| **Infraestrutura** | Banco de dados na nuvem, motor de cálculo dinâmico de spreads e APIs de monitoramento | $15.000 |
| **Outros Custos** | Consultoria especializada em conformidade tributária cambial (IOF de câmbio e regras BACEN) | $12.000 |
| **TOTAL** | **Investimento Inicial de Desenvolvimento do EP-04** | **$155.000** |

#### 3.4.3 Retorno Esperado
* **Retorno Qualitativo (Estratégico):** Criação de um pilar de engajamento recorrente no SuperApp, impulsionando a fidelização e uso de serviços cruzados do ecossistema do banco.
* **Retorno Financeiro Conservador:** Receita incremental líquida de **$300.000 USD/ano** no primeiro ano (aquisição de 15.000 novos correntistas ativos de Conta Global gerando valor médio de spread anual de $20 por usuário).
* **Retorno Financeiro Otimista:** Receita incremental líquida de **$1.250.000 USD/ano** (aquisição acelerada de 45.000 novos clientes ativos com spread de $25 por usuário ($1.125.000) + acréscimo de 15% na recorrência de envios dos clientes existentes devido à facilidade de uso ($125.000)).
* **Memória de Cálculo:** Atualmente, o abandono no funil de remessa é de 22%, correspondendo a transações perdidas. A redução para 5% e a aceleração do envio atraem novos clientes do varejo insatisfeitos com a concorrência tradicional de tarifas abusivas.

#### 3.4.4 Payback e ROI
```
Cenário Conservador:
ROI = ( $300.000 - $155.000 ) / $155.000 = +93,55%
Payback = ( $155.000 / $300.000 ) * 12 = 6,2 meses

Cenário Otimista:
ROI = ( $1.250.000 - $155.000 ) / $155.000 = +706,45%
Payback = ( $155.000 / $1.250.000 ) * 12 = 1,5 meses
```
**Conclusão:** O épico EP-04 apresenta o maior ROI financeiro em potencial do portfólio. A facilidade e atratividade do serviço viabilizam uma rápida aquisição de mercado, tornando-se o coração da proposta de valor comercial da Conta Global FX do Banco Inter.

#### 3.4.5 Métricas de Sucesso
* **KPI 1:** Redução de perdas de abandono na simulação de remessas de 22% para < 5% em 3 meses pós-lançamento.
* **KPI 2:** Processamento transacional (débito de BRL, cobrança de IOF/spread e crédito de USD nos EUA) em tempo total de ponta a ponta abaixo de 5 segundos em 99,5% das transações.
* **KPI 3:** Expansão de 25% no volume total de remessas líquidas transacionadas no primeiro trimestre.
* **KPI 4:** Geração imediata (emissão eletrônica em < 1 segundo) de 100% dos contratos regulatórios de câmbio exigidos pelos órgãos fiscais.

#### 3.4.6 Premissas e Riscos
* **Premissa 1:** A UX intuitiva com cotação de spread garantida por x segundos reduz barreiras cognitivas dos usuários. *(Fonte: Benchmark de Experiência de Remessas Wise e Nomad, Etapa 03).*
* **Premissa 2:** Capacidade de processamento ACID síncrono nativo entre ledgers brasileiros e americanos.
* **Risco de Integração Externa:** Indisponibilidade de APIs ou filas do Banco Central nos picos operacionais de fechamento do câmbio diário (Risco Médio - mitigado com filas secundárias de contingência).
* **Risco Cambial:** Volatilidade extrema no mercado financeiro global durante os segundos em que a taxa de conversão é fixada em tela para o cliente final (Risco Baixo - mitigado via algoritmos de hedge automático de microtransações).

---

### 3.5 EP-05: Motor de Compliance de AML em Tempo Real

#### 3.5.1 Objetivos de Negócio
* **Primários:**
  * *10. Aumento de controle ou monitoramento:* Prevenção contra riscos de lavagem de dinheiro, garantindo conformidade com a Travel Rule internacional.
  * *14. Evitar perdas (churn/turnover):* Reduzir retenções indevidas de transações e contas de clientes de boa-fé.
* **Secundários:**
  * *20. Redução de custos administrativos:* Reduzir a necessidade de analistas humanos para verificação manual de falsos positivos de AML.
  * *9. Eficiência operacional:* Triagem instantânea em milissegundos sem travar o processamento da transação financeira.
* **Meta Quantificada:** Reduzir transações encaminhadas para a fila de análise manual de AML de 6,5% para menos de 1,3% através de refinamento de motores de busca.

#### 3.5.2 Investimento Esperado
| Componente | Detalhe do Investimento | Custo (USD) |
| :--- | :--- | :--- |
| **Pessoas** | Equipe de engenharia e risco (1 Especialista em Risco, 3 Devs Sênior) × 3 meses | $96.000 |
| **Infraestrutura** | Cluster Redis de cache rápido na nuvem AWS, além de APIs de inteligência cadastral | $35.000 |
| **Outros Custos** | Custos de licenciamento de listas de sanções de mercado reconhecidas (ex. Dow Jones, OFAC) | $20.000 |
| **TOTAL** | **Investimento Inicial de Desenvolvimento do EP-05** | **$151.000** |

#### 3.5.3 Retorno Esperado
* **Retorno Qualitativo (Estratégico):** Evita sanções ou perda de licença de atuação do Banco Inter junto ao BACEN e ao FinCEN norte-americano. Protege a integridade corporativa e reputação do banco.
* **Retorno Financeiro Conservador:** Economia direta de **$90.000 USD/ano** através da otimização de custos de backoffice com desnecessidade de expansão de times humanos (redução equivalente a 3 FTEs de analistas dedicados a falsos positivos).
* **Retorno Financeiro Otimista:** Economia total consolidada de **$330.000 USD/ano** (economia operacional equivalente a 5 FTEs ($150.000 USD) + redução de multas regulatórias provisionadas em passivos por desconformidade fiscal ($100.000 USD) + retenção de contas de alta renda que fariam churn devido a bloqueios indevidos ($80.000 USD)).
* **Memória de Cálculo:** Atualmente, 6,5% do total de transações cai na esteira manual de compliance por causa de semelhanças fonéticas ou falhas de bases estáticas legadas. A triagem moderna com cache local reduz a incidência de falsos positivos na esteira em 80%.

#### 3.5.4 Payback e ROI
```
Cenário Conservador:
ROI = ( $90.000 - $151.000 ) / $151.000 = -40,39%
Payback = ( $151.000 / $90.000 ) * 12 = 20,1 meses

Cenário Otimista:
ROI = ( $330.000 - $151.000 ) / $151.000 = +118,54%
Payback = ( $151.000 / $330.000 ) * 12 = 5,5 meses
```
**Conclusão:** Este é o principal épico de conformidade da plataforma. O retorno no cenário conservador é de longo prazo, porém sob forte atividade transacional ou sob o impacto de multas regulatórias evitadas, o payback cai para apenas 5,5 meses, justificando sua relevância imediata para a sustentabilidade da operação global de câmbio.

#### 3.5.5 Métricas de Sucesso
* **KPI 1:** Redução de transações retidas erroneamente para análise manual de AML de 6,5% para < 1,3% do volume de remessas em até 120 dias.
* **KPI 2:** Tempo de resposta da triagem automatizada contra listas globais (OFAC/PEP) mantido abaixo de 100 milissegundos.
* **KPI 3:** Tempo de análise humana na fila fast-track (quando estritamente necessário) reduzido para < 15 minutos em horário de funcionamento comercial.
* **KPI 4:** Zero multas ou notificações regulatórias por falhas na identificação de listas de restrição de transações transfronteiriças.

#### 3.5.6 Premissas e Riscos
* **Premissa 1:** Atualização diária automatizada de listas restritivas em memória (Redis) garante integridade de triagem rápida. *(Fonte: Benchmarks de KYC em Tempo Real, Nomad e Wise).*
* **Premissa 2:** A API externa de inteligência para casos complexos possui disponibilidade superior a 99,9%.
* **Risco de Custo:** Aumento do custo transacional ou licenciamento de APIs de enriquecimento de KYC (Dow Jones/IDology) que inflacionem o OpEx (Risco Baixo).
* **Risco Operacional:** Falsos negativos de compliance que passem pelo motor automatizado, gerando incidentes de risco (Risco Alto - mitigado via duplo check amostral aleatório diário).

---

### 3.6 EP-06: Cartão Multimoedas Inteligente (Seamless FX Smart Wallet)

#### 3.6.1 Objetivos de Negócio
* **Primários:**
  * *6. Fidelização de clientes:* Evitar a migração de correntistas ativos para serviços especializados.
  * *1. Aumentar a receita:* Capturar receita líquida de intercâmbio e spread de compras internacionais físicas e digitais.
* **Secundários:**
  * *2. Alavancagem da marca:* Posicionar o Banco Inter como principal banco de viagem e consumo transfronteiriço nacional.
  * *13. Aumentar a base de clientes:* Atração acelerada de viajantes frequentes de varejo.
* **Meta Quantificada:** Diminuir taxa de timeouts de autorizações com cartões no exterior de 4,5% para < 0,1% e SLA total da transação para menos de 1,5 segundos.

#### 3.6.2 Investimento Esperado
| Componente | Detalhe do Investimento | Custo (USD) |
| :--- | :--- | :--- |
| **Pessoas** | Squad dedicada (1 Arquiteto, 4 Devs Backend/Mobile, 1 QA) × 6 meses (36 homem-mês × $8.000) | $288.000 |
| **Infraestrutura** | API Gateway com Redis cache global distribuído e alta disponibilidade multi-região | $45.000 |
| **Outros Custos** | Custos regulatórios e de homologação junto às bandeiras de cartões (Visa/Mastercard) | $50.000 |
| **TOTAL** | **Investimento Inicial de Desenvolvimento do EP-06** | **$383.000** |

#### 3.6.3 Retorno Esperado
* **Retorno Qualitativo (Estratégico):** Experiência do usuário de altíssima qualidade no ponto de venda internacional, gerando engajamento orgânico, alta classificação em lojas de apps e recomendação direta da marca.
* **Retorno Financeiro Conservador:** Ganhos e recuperação de receitas líquidas somando **$207.200 USD/ano** (recuperação de transações perdidas por timeouts que geram taxas de intercâmbio/spread de $7.200 USD + valor de retenção de 10.000 clientes ativos gerando valor de $200.000 USD/ano).
* **Retorno Financeiro Otimista:** Ganhos de **$1.180.000 USD/ano** (recuperação direta de intercâmbio/spread de transações de timeouts ($30.000 USD) + receita recorrente de novos correntistas atraídos pela experiência premium de conversão ultra-rápida (40.000 novos usuários gerando spread anual médio de $25 por usuário = $1.000.000 USD) + aumento do uso de fallback inteligente de moedas em compras ($150.000 USD)).
* **Memória de Cálculo:** Atualmente, a taxa de timeouts e problemas de conexões com cores legados gera 4,5% de recusas de compras em terminais internacionais. A introdução de autorização inteligente em cache resolve esse atrito, capturando o fluxo de compras retido.

#### 3.6.4 Payback e ROI
```
Cenário Conservador:
ROI = ( $207.200 - $383.000 ) / $383.000 = -45,90%
Payback = ( $383.000 / $207.200 ) * 12 = 22,2 meses

Cenário Otimista:
ROI = ( $1.180.000 - $383.000 ) / $383.000 = +208,09%
Payback = ( $383.000 / $1.180.000 ) * 12 = 3,9 meses
```
**Conclusão:** O épico EP-06 demanda o maior montante de capital inicial, o que dilata o tempo de recuperação no cenário conservador para 22 meses. Todavia, devido ao apelo de marketing direto do cartão, seu impacto comercial na atração de novos clientes viabiliza o retorno de todo o investimento em apenas 3,9 meses sob condições normais de tração comercial.

#### 3.6.5 Métricas de Sucesso
* **KPI 1:** Redução de falhas e timeouts de autorização de compras internacionais em terminais físicos de 4,5% para < 0,1% em 6 meses.
* **KPI 2:** Tempo de resposta na autorização do cartão no terminal internacional mantido abaixo de 1,2 segundos em 99% dos casos.
* **KPI 3:** Crescimento de 40% no Volume de Transações de Cartão (Card PV) no primeiro ano de operação da carteira inteligente.
* **KPI 4:** Aumento de 30% na conversão de compras que utilizam fallback inteligente de moedas (ex: compras em EUR com débito automático em BRL por insuficiência de saldo em EUR).

#### 3.6.6 Premissas e Riscos
* **Premissa 1:** Bandeiras internacionais de cartões (Visa/Mastercard) suportam regras dinâmicas e imediatas de fallback de carteiras multimoedas configuradas em caches de borda de baixa latência. *(Fonte: Mapeamento de Autorizadores da Wise e Nomad, Etapa 03).*
* **Premissa 2:** Clientes mantêm saldos ativos de fallback em BRL na conta tradicional do Banco Inter.
* **Risco Técnico:** Latência nas redes de comunicação globais entre o terminal de compra internacional e os servidores em nuvem da AWS (Risco Alto - mitigado com arquitetura de redes redundantes Anycast).
* **Risco de Segurança:** Tentativa de ataques de gastos duplicados (Double-Spending) tirando proveito da validação rápida de saldos cacheados em memória (Risco Médio - mitigado via limites parametrizados e bloqueios instantâneos por IA comportamental).

---

## 4. Checklist de Quality Gates

Para garantir a qualidade, rigor metodológico e rastreabilidade dos cálculos, consolidamos o atendimento dos critérios de aceitação para cada iniciativa:

| Épico Candidato | Gate 1: ROI Mapeado ou Justificado | Gate 2: Vinculado a >= 2 Objetivos | Gate 3: Possui >= 4 Métricas SMART | Gate 4: Premissas e Riscos Claros | Status de Qualidade |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **EP-01:** FX Orchestrator | Aprovado | Aprovado (9, 11, 10, 12) | Aprovado (4 KPIs) | Aprovado | **APROVADO** |
| **EP-02:** Trânsito Finxact | Aprovado | Aprovado (9, 11, 4, 16) | Aprovado (4 KPIs) | Aprovado | **APROVADO** |
| **EP-03:** Gateway Tazapay | Aprovado | Aprovado (1, 8, 12, 15) | Aprovado (4 KPIs) | Aprovado | **APROVADO** |
| **EP-04:** Remessas Internas | Aprovado | Aprovado (1, 7, 6, 13) | Aprovado (4 KPIs) | Aprovado | **APROVADO** |
| **EP-05:** Compliance AML | Aprovado | Aprovado (10, 14, 20, 9) | Aprovado (4 KPIs) | Aprovado | **APROVADO** |
| **EP-06:** Cartão Multimoedas | Aprovado | Aprovado (6, 1, 2, 13) | Aprovado (4 KPIs) | Aprovado | **APROVADO** |

---

## 5. Insumos para a Etapa 05

Todas as definições financeiras, premissas de investimento, retorno estimado e metas operacionais quantificadas compiladas neste documento estão integralmente validadas e prontas para alimentar a **Seção 4.1 (Visão Geral e ROI)** de cada um dos documentos de especificação de Épicos (Fase 05). 

A rastreabilidade entre as dores identificadas, os benchmarks competitivos e as soluções desenhadas garante consistência arquitetural e forte sustentação estratégica perante os tomadores de decisão e patrocinadores do Banco Inter.

---
_Documento elaborado com a skill 04 — Definição de ROI · The Visionary · UpStream Foursys_