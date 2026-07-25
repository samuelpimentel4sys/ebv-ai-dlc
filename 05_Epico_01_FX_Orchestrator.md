# [BINTER-EP-01] FX Orchestrator & State Machine
Etapa 05/06 · v1.0 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** FX Orchestrator & State Machine
*   **ID do Épico:** `BINTER-EP-01`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento do microsserviço orquestrador de câmbio transfronteiriço utilizando o padrão Saga Orquestrado (AWS Step Functions), encarregado de gerenciar com idempotência e resiliência absoluta as transições de estado entre o Core Brasil, o Core EUA (Finxact) e o gateway de liquidação externa (Tazapay).

## 3. Contexto / Problema de Negócio
O processamento atual de remessas e operações cambiais transfronteiriças no varejo brasileiro sofre com alta latência operacional (média de 2 horas até D+1). Para o Banco Inter, oferecer transações de câmbio instantâneas no SuperApp exige eliminar a fricção regulatória e técnica de intermediários tradicionais.
O principal desafio é garantir a consistência dos saldos entre as diferentes jurisdições e cores bancários sob condições de instabilidade de rede sem incorrer em perdas financeiras (gastos duplicados) ou experiências frustrantes de tempo de espera. Insights extraídos do benchmark competitivo da Wise e Nomad demonstram que orquestradores nativos baseados em transições de estado transacionais e compensações imediatas em tempo real são cruciais para atingir níveis de satisfação de mercado e SLAs de resposta inferiores a 5 segundos de ponta a ponta.

## 4. Proposta de Valor / Benefício
*   **Velocidade:** SLA transacional reduzido drasticamente para o cliente final.
*   **Resiliência Financeira:** Garantia de concorrência zero e duplicidade nula em ambientes de rede móvel intermitentes, protegendo o saldo do cliente e o balanço do banco.
*   **Auditorabilidade:** Rastreabilidade em tempo real de cada etapa cambial por meio de logs de transição persistidos.

### 4.1 ROI do Épico
O ROI específico desta iniciativa apoia-se na centralização técnica e na eliminação de tarifas de intermediação de terceiros, reduzindo custos de reconciliação de transações falhas.
```text
Investimento CapEx Alocado: R$ 900.000,00 (21.4% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 900.000,00 no FX Orchestrator apoia diretamente a captura de R$ 21.000.000,00 em receitas brutas de spread no Ano 1 de operação, garantindo o payback consolidado em apenas 7 meses.**

#### Métricas SMART Associadas:
1.  **SLA de Processamento Interno:** Resposta do orquestrador de ponta a ponta menor que 1.5 segundo em 99% das chamadas em ambiente controlado.
2.  **Taxa de Erro Técnico do Orquestrador:** Menos de 0.01% de exceções internas não tratadas no primeiro ano de produção.
3.  **Indisponibilidade Operacional:** SLA de uptime de 99.99% mantido na camada AWS Step Functions e Redis.
4.  **Inconsistência de Saldos (Duplicidade):** Exatamente 0.00% de transações processadas em duplicidade devido a problemas de idempotência.

#### Premissas de ROI:
*   As APIs externas (Finxact e Tazapay) responderão com latência estável inferior a 800ms.
*   O cluster Redis manterá tempo de acesso a chaves distribuídas (locks) inferior a 10ms.

## 5. Descrição Detalhada
O orquestrador atuará de forma reativa a cada solicitação de transação cambial. Utilizando o padrão Saga Orquestrado, ele coordenará os microsserviços por meio de uma máquina de estados na nuvem AWS, comandando bloqueios temporários de fundos e disparando compensações de devolução caso ocorra falha na perna de pagamento (Payout).

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Orquestração de transações via AWS Step Functions | Desenvolvimento ou alteração de regras do Core Brasil |
| Gestão de idempotência distribuída no Redis (TTL de 15 min) | Processo físico de envio e distribuição de cartões |
| Emissão de mensagens analíticas e operacionais no Apache Kafka | Onboarding de clientes e análises KYC manuais |
| Execução de mecanismos de compensação SAGA (re-crédito) | Processamento de câmbio de moedas exóticas (fora EUR/USD) |

## 6. Critérios de Aceite
1.  **Idempotência Obrigatória:** Cada chamada recebida na API do orquestrador deve exigir um cabeçalho `X-Idempotency-Key` (UUIDv4). O orquestrador deve registrar e validar a chave no Redis distribuído antes de disparar o fluxo SAGA.
2.  **Tratamento de Concorrência:** Duas requisições simultâneas com a mesma chave de idempotência num intervalo menor que 15 minutos devem receber o mesmo JSON de retorno da primeira execução, sem duplicar chamadas ao core.
3.  **Fluxo de Compensação em Caso de Falha de Payout:** Se a requisição de Payout para a Tazapay retornar qualquer código HTTP de erro (4xx/5xx) ou sofrer timeout (10s), o orquestrador deve, obrigatoriamente, reverter o "Hold" no Core Finxact disparando uma requisição de cancelamento de Hold em até 2 segundos.
4.  **Vazão e Escalabilidade:** O orquestrador deve processar até 200 transações simultâneas por segundo (TPS) sob estresse de infraestrutura sem degradar a latência limite interna de 1.5s em 95% das transações.
5.  **Eventos no Apache Kafka:** Cada transição de estado da máquina SAGA (Iniciada, Retida, Paga, Compensada, Falha) deve publicar um payload JSON contendo ID da transação, chave de idempotência, status e timestamp no tópico `global-fx-states`.
6.  **Tratamento de Exceções Inesperadas:** Exceções não conhecidas na infraestrutura AWS devem mover a transação para o estado `SUSPENDED_FOR_MANUAL_RECONCILIATION` e gerar alerta de severidade 1 no Datadog/Splunk para tratamento da equipe de plantão de engenharia.

## 7. Features Sugeridas
*   `BINTER-EP-01-F01` - **Validador de Idempotência com Redis:** barreira distribuída baseada em chaves temporárias para bloquear requisições duplicadas instantaneamente.
*   `BINTER-EP-01-F02` - **Máquina de Estados SAGA (Step Functions):** mapeamento e execução estruturada de transições de fluxos felizes e infelizes em ASL.
*   `BINTER-EP-01-F03` - **Motor de Compensação Automatizada:** algoritmos de rollback e liberação imediata de saldos retidos sob falhas operacionais no trilho de payout.
*   `BINTER-EP-01-F04` - **Rastreador de Estados e Integração Kafka:** camada adaptadora que traduz as transições de status internas em mensagens estruturadas para o broker central de eventos.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Provisionamento do cluster de cache Redis Enterprise com redundância geográfica de dados.
    *   Configuração do cluster AWS Step Functions e permissões IAM configuradas para microsserviços.
*   **Dependências de Negócio:**
    *   Aprovação do desenho técnico do SAGA e regras de reversão de saldo junto à equipe de Riscos e Auditoria Interna do Banco Inter.
*   **Dependências de Épicos:**
    *   Depende do `BINTER-EP-02` (Integração Core EUA) para expor as APIs de bloqueio e débito ("Hold/Post").
    *   Depende do `BINTER-EP-03` (Integração FX & Payout Gateway) para as rotas de envio de Euros.

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |
| :--- | :--- | :--- |
| **Timeout de APIs externas (Tazapay/Finxact):** Demora nas respostas de terceiros travando recursos do orquestrador e estourando o SLA de 5s do cliente. | **Alto** | Implementar timeout estrito de 5 segundos para requisições externas e mecanismo de retentativas exponencial (backoff com jitter). |
| **Inconsistência eventual em D+0:** Falha na máquina de estados que deixa saldo pendente sem compensação nem pagamento por bugs não previstos. | **Alto** | Criação de job de conciliação automática assíncrona executado a cada 1 hora comparando a base do Redis com as transações confirmadas. |
| **Sobrecarga de chamadas no Redis:** Cluster de idempotência fora do ar ou com alta latência por gargalo de I/O. | **Médio** | Cluster Redis operando em arquitetura Multi-AZ com réplicas de leitura e failover automático de menos de 1 segundo. |

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Expectativa de que a tecnologia de orquestração reduza tempos de onboarding e tarifas de transações, tornando a plataforma líder de conversão.
*   **Mariana Silveira (Tech Lead):** Expectativa de um sistema sem pontos de falha única, com observabilidade total, facilidade de debug de Sagas que falharam e altíssima cobertura de testes de integração.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Cobertura de testes unitários e de integração acima de 90%; 100% dos cenários de falhas simuladas com rollback automático de fundos funcionando perfeitamente.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Média real de processamento interno de ponta a ponta menor que 1s; zero incidentes de travamento ou duplicidade de saldos em produção.
*   **Longo Prazo (1 ano):** Sustentação de um volume transacional de 500.000 remessas mensais com taxa de transações inconsistentes em 0.00%.

## 12. Observações
*   **Próximos Passos:** Mapear o detalhamento de testes de estresse com cenários de falha física de infraestrutura AWS (Chaos Engineering).
*   **Referências:** Estudo do modelo de orquestração de Saga do Netflix Conductor e orquestração assíncrona da Wise.
*   **Nota de Elaboração:** Documento elaborado seguindo estritamente os preceitos de arquitetura orientada a eventos e resiliência financeira.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens mapeados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Redução de latência de ponta a ponta e eliminação de intermediação técnica. |
| Problema de negócio com dados/fatos | **APROVADO** | Detalhamento sobre o SLA de 2 horas e benchmark em comparação com competidores. |
| Insights de 2+ casos de mercado | **APROVADO** | Benchmark focado nas soluções adotadas por Wise e Nomad. |
| Mínimo de 4 métricas SMART | **APROVADO** | Detalhadas na seção 4.1 (SLA < 1.5s, erro < 0.01%, uptime 99.99%, duplicidade 0.00%). |
| Premissas de ROI explícitas | **APROVADO** | Mapeadas na seção 4.1 (APIs externos < 800ms e latência Redis < 10ms). |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios técnicos e funcionais claros e testáveis descritos na seção 6. |
| Todas as 12 seções preenchidas | **APROVADO** | Sem lacunas ou marcadores pendentes. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_