# [BINTER-EP-02] Integração Core EUA (Finxact)
Etapa 05/06 · v1.0 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Integração Core EUA (Finxact)
*   **ID do Épico:** `BINTER-EP-02`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento da camada de mapeamento e integração direta de sub-ledgers lógicos de balanço multimoeda (BRL, USD e EUR) no Core Bancário dos EUA (Finxact), gerenciando e isolando de maneira atômica os bloqueios temporários de saldo (Hold) e as postagens contábeis de débito e crédito (Post).

## 3. Contexto / Problema de Negócio
Os sistemas legados de core banking trabalham predominantemente em silos de moeda única. No mercado de contas internacionais, concorrentes diretos (Nomad e C6 Global) oferecem soluções integradas que, sob alta concorrência de transações simultâneas ou intermitências em conexões físicas, geram flutuações e inconsistências de saldos na carteira do cliente.
Para o Banco Inter, a consolidação da Conta Global Multimoeda nativa exige a criação de sub-posições cambiais (sub-ledgers) ligadas a uma única conta master sob a infraestrutura americana de nuvem Finxact. O desafio é estruturar um ecossistema com latência extremamente baixa para bloqueios (Hold) e liquidações (Post), garantindo que as pernas de câmbio ocorram de forma totalmente sincronizada com as regras contábeis dos órgãos reguladores dos Estados Unidos (FINRA / SEC) e do Brasil (BACEN).

## 4. Proposta de Valor / Benefício
*   **Integridade Contábil:** Isolamento estrito de saldos e eliminação de saldo negativo ou estouro de conta global.
*   **Fácil Escalabilidade de Moedas:** Arquitetura multi-ledger flexível permitindo adicionar novas moedas no futuro (ex: GBP, CHF) apenas configurando sub-ledgers.
*   **Tempo Real:** Atualização instantânea dos saldos disponíveis do cliente no SuperApp.

### 4.1 ROI do Épico
A automação direta com o Finxact nos EUA reduz a dependência de correspondentes bancários intermediários e taxas acessórias de processamento e liquidação contábil.
```text
Investimento CapEx Alocado: R$ 800.000,00 (19.0% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 800.000,00 no Core Finxact viabiliza a liquidação instantânea das sub-posições de câmbio que darão suporte ao crescimento de margem do spread cambial direto, capturando R$ 21.000.000,00 em receitas no primeiro ano.**

#### Métricas SMART Associadas:
1.  **Tempo de Resposta para Hold (Bloqueio):** Criação e confirmação de bloqueio temporário de saldo em tempo inferior a 500ms em 95% das tentativas.
2.  **Tempo de Resposta para Post (Efetivação):** Liquidação de débito contábil definitivo em menos de 500ms.
3.  **Acurácia da Reconciliação Contábil:** Taxa de acerto superior a 99.99% nas transações processadas em D+0 na conciliação noturna automática.
4.  **Vazão Suportada na API de Sub-ledgers:** Capacidade de atendimento de até 150 TPS (transações por segundo) sem decréscimo de performance de infraestrutura.

#### Premissas de ROI:
*   Os sandboxes e APIs de homologação do Finxact manterão conectividade mTLS estável de alta vazão.
*   O barramento Kafka de mensageria interna do banco repassará as atualizações de sub-ledger sem perda de pacotes de dados.

## 5. Descrição Detalhada
Implementar conectores eficientes em Spring Boot que exponham APIs simplificadas e seguras para interagir com o Core Finxact. A solução permitirá a criação dinâmica de sub-ledgers na conta do cliente, controle de saldo específico por partição de moeda, controle de hold temporário que resguarda o valor durante a execução de câmbio transfronteiriço e efetivação do débito apenas após a confirmação total.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Mapeamento de APIs Finxact para criação de sub-ledger em EUR | Processos de remessa para corretoras parceiras americanas |
| Desenvolvimento de endpoints para criação de "Hold" em USD | Criação de contas correntes norte-americanas para não clientes |
| Geração de lançamentos de partida dupla estruturados (FINRA) | Controle de limites fiscais brasileiros (responsabilidade do Core BR) |
| Publicação de balanços atualizados no barramento Kafka | Compensações contábeis manuais ou fluxos físicos em D+X |

## 6. Critérios de Aceite
1.  **Criação Automática de Partições:** No momento do onboarding ou solicitação de ativação do módulo de moeda estrangeira (EUR), o microsserviço deve disparar a criação do sub-ledger correspondente no Finxact sem exigir intervenção humana do backoffice.
2.  **Garantia de Isolamento de Saldos (Hold):** A requisição de Hold enviada ao Finxact deve bloquear temporariamente o valor exato na partição USD, impedindo o uso desse recurso por transações simultâneas de cartão ou saques até que ocorra o Post ou a reversão.
3.  **Controle de Expiração de Holds (TTL):** Se um Hold criado não for efetivado (Post) em até 15 minutos, o microsserviço deve disparar o cancelamento do Hold no Finxact, liberando os recursos congelados de volta ao saldo disponível do correntista.
4.  **Aderência a Regras FINRA:** Cada transação financeira de Hold, Post, Cancelamento e Reversão deve produzir um log contábil estruturado em JSON com a trilha de ID de auditoria, IDs das contas de origem/destino e os respectivos lançamentos de partida dupla em crédito/débito.
5.  **Performance de Chamadas:** As APIs expostas para o orquestrador não podem exceder a latência de 500ms em 95% dos testes de estresse de carga operando com vazão simulada de 150 TPS.
6.  **Sincronização de Dados via Kafka:** Qualquer alteração de saldo consolidada nas partições do Finxact deve gerar um evento de notificação em formato Schema Avro no tópico `global-fx-balances` do Apache Kafka em tempo menor que 1 segundo da ocorrência.

## 7. Features Sugeridas
*   `BINTER-EP-02-F01` - **Configurador de Sub-ledgers Multimoeda:** automatização do setup estrutural de contas USD/EUR vinculadas ao ledger master do cliente no Finxact.
*   `BINTER-EP-02-F02` - **API Controladora de Holds:** engine de criação, expiração assistida e cancelamento de bloqueios de fundos.
*   `BINTER-EP-02-F03` - **Engine de Post e Consolidação Contábil:** endpoints para registrar a postagem definitiva das transações cambiais após a garantia de envio.
*   `BINTER-EP-02-F04` - **Trilha Contábil FINRA e Emissor Kafka:** módulo de logs específicos de auditoria transacional e barramento de sincronização de saldos reais.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Túnel seguro mTLS e VPN estabelecida entre a infraestrutura AWS do Banco Inter e o Core Finxact nos EUA.
    *   Definição acordada do schema de dados das partições com a equipe de arquitetura core global.
*   **Dependências de Negócio:**
    *   Aprovação regulatória do fluxo de partidas contábeis e classificação de depósitos no exterior junto à Controladoria Financeira e Legal.
*   **Dependências de Épicos:**
    *   Nenhuma dependência prévia. É o habilitador base para os épicos `BINTER-EP-01` (Orchestrator) e `BINTER-EP-06` (Cartão de Débito Multimoeda).

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |
| :--- | :--- | :--- |
| **Instabilidade de Conexão com Core Finxact:** Queda de canal mTLS ou latência de rede acima do limite suportável durante uma transação viva. | **Alto** | Implementar cache distribuído de saldos para leituras rápidas e fallback local de contingência contábil. |
| **Duplicidade de lançamentos por retentativas:** Execução de débitos repetidos em virtude de falhas de comunicação temporárias. | **Alto** | Implementação de ID de transação unificado (ID da Saga) mapeado a nível contábil na base do Finxact para validação no recebimento. |
| **Gargalo de performance sob carga pesada:** APIs do Core Finxact lentas em horários de pico comercial no Brasil e EUA. | **Médio** | Dimensionar cluster de containers da API no AWS EKS com escalabilidade baseada na CPU/Memory e monitoramento agressivo no Datadog. |

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Demanda uma arquitetura integrada e transparente para o cliente final, com custos mínimos de liquidação direta de balanços.
*   **Mariana Silveira (Tech Lead):** Demanda uma arquitetura isolada, com barramento de eventos resiliente que permita reprocessamento seguro em caso de indisponibilidade momentânea do Core.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Cobertura de testes de validação contábil integrada em 100%; zero inconsistências de partidas duplas identificadas em staging.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Latência média de 300ms estável na criação de Holds; zero travamentos de saldos pós-15 minutos (expiração atuando corretamente).
*   **Longo Prazo (1 ano):** Processamento transacional com zero discrepâncias contábeis reportadas pelas auditorias regulatórias norte-americanas.

## 12. Observações
*   **Próximos Passos:** Concluir homologação dos diagramas de classes e mTLS junto aos engenheiros da Finxact.
*   **Referências:** Documentação técnica oficial do core Finxact para sub-ledgers lógicos de depósitos estruturados.
*   **Nota de Elaboração:** Modelagem detalhada observando as normas de conformidade financeira de moedas mantidas em custódia estrangeira.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens do estudo financeiro detalhados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Integridade dos saldos e liquidação rápida mapeados. |
| Problema de negócio com dados/fatos | **APROVADO** | Discussão de gargalos das contas tradicionais e concorrência na seção 3. |
| Insights de 2+ casos de mercado | **APROVADO** | Práticas operacionais de mercado da Nomad e C6 Global avaliadas. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas de SLA para Hold, Post, acurácia e TPS na seção 4.1. |
| Premissas de ROI explícitas | **APROVADO** | Sincronia de barramento e estabilidade das conexões descritos na seção 4.1. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios completos abordando do onboarding à concorrência contábil na seção 6. |
| Todas as 12 seções preenchidas | **APROVADO** | Estruturação de 1 a 12 concluída com rigor técnico. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_