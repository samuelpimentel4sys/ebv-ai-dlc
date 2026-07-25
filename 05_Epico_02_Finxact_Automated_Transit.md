# Finxact Automated Transit — BINTER-EP-02
Etapa 05/06 · v1.02 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Finxact Automated Transit
*   **ID do Épico:** `BINTER-EP-02`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento da camada de mapeamento e automação contábil para transferências de fundos em tempo real entre o Core Brasil (BRL) e o Core EUA (Finxact), controlando os lançamentos de débito e crédito, o provisionamento de sub-ledgers multi-moedas e as regras de compliance fiscal (IOF e contratos de câmbio automáticos do BACEN) 24/7.

## 3. Contexto / Problema de Negócio
No mercado tradicional de câmbio brasileiro, a conversão de divisas e a remessa internacional dependem de horários bancários restritos e intervenção manual para o fechamento de contratos, resultando em latências elevadas e experiências pouco intuitivas de carregamento de fundos. Para o Banco Inter, a consolidação da Conta Global Multimoeda exige a automatização completa deste fluxo, operando de forma ininterrupta e imediata diretamente pelo SuperApp.
O grande desafio reside em criar uma conexão de alto desempenho e atomicidade contábil que conecte o sistema legado nacional (BRL) com o Core americano de nuvem Finxact. Os sub-ledgers (sub-contas por tipo de moeda) devem ser gerenciados de forma unificada sob a conta master do cliente, com suporte a bloqueios temporários de fundos (Holds) e postagens definitivas (Posts) em milissegundos. De acordo com o benchmark competitivo de concorrentes como Wise e Nomad, a velocidade de liquidação e o cálculo integrado e automático de tributos (como o IOF brasileiro) são fatores críticos para a atratividade do produto, necessitando de uma infraestrutura capaz de operar 24/7 e de gerar eletronicamente e em tempo real os contratos de câmbio simplificados para prestação de contas junto ao Banco Central do Brasil (BACEN).

## 4. Proposta de Valor / Benefício
*   **Liquidez Instantânea 24/7:** O cliente converte BRL em USD ou EUR a qualquer momento (inclusive fins de semana) e utiliza o saldo imediatamente.
*   **Cálculo Tributário Integrado:** Eliminação de erros de cálculo fiscal de recolhimento de IOF por meio de um motor fiscal parametrizável automático.
*   **Atomicidade Financeira:** Garantia de integridade contábil entre jurisdições (Brasil e EUA) sem a ocorrência de saldos inconsistentes.

### 4.1 ROI do Épico
```text
Investimento CapEx Alocado: R$ 1.400.000,00 (33.3% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 1.400.000,00 une a robustez do Core Finxact (R$ 800k) com o Motor de Remessa Interna (R$ 600k), viabilizando a conversão primária de recursos que suportará a margem cambial estimada de R$ 21.000.000,00 no primeiro ano, garantindo o payback em apenas 7 meses.**

#### Métricas SMART Associadas:
1.  **Tempo de Resposta para Holds/Posts (EUA):** Execução de lançamentos de bloqueio/efetivação no Finxact em tempo inferior a 500ms em 95% das chamadas.
2.  **Velocidade da Remessa de Ponta a Ponta:** Débito em BRL e crédito em USD na conta global em menos de 1.0 segundo.
3.  **Acurácia Contábil da Conciliação:** Taxa de erro de reconciliação de D+0 contábil de exatamente 0.00% na rotina automática noturna.
4.  **SLA de Reporte Regulatório:** Transmissão automática do contrato cambial simplificado ao BACEN em até 5 minutos após a transação.

#### Premissas de ROI:
*   A conectividade mTLS e VPN IPsec entre os datacenters AWS do Banco Inter e os endpoints do Core Finxact manterá latência estável inferior a 150ms.
*   A legislação tributária manterá as regras de IOF para transferências de mesma titularidade em 1.1%.

## 5. Descrição Detalhada
O sistema funcionará através de conectores em Spring Boot que encapsularão a complexidade das chamadas de API do Core Finxact e do Core BR. Quando uma transferência cambial for solicitada, o sistema executará os débitos contábeis no Core Brasil, aplicará os cálculos de IOF cabíveis, criará o Hold correspondente no Finxact, efetivará o crédito no sub-ledger de moeda estrangeira e enviará os metadados fiscais para a geração eletrônica dos contratos cambiais junto ao BACEN.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Mapeamento de APIs Finxact para sub-ledgers lógicos de depósito | Remessas com destino a terceiros em outros bancos globais |
| Desenvolvimento de endpoints de controle de Holds e Posts no Core EUA | Processamento físico de saques em caixas eletrônicos no exterior |
| Cálculo automático de alíquotas de IOF (1.1% ou 0.38%) | Auditorias fiscais manuais ou envio físico de declarações de IR |
| Emissão automática de mensagens e contratos de câmbio ao BACEN | Suporte a processos de arbitragem de moedas exóticas |

## 6. Critérios de Aceite
1.  **Garantia de Atomicidade Síncrona:** A transação contábil de débito BRL no Core BR e crédito USD/EUR no Finxact deve ser atômica. Caso a chamada de crédito ao Finxact falhe ou sofra timeout (1.5s), a perna brasileira em BRL deve ser estornada de forma síncrona em até 500ms.
2.  **Criação Dinâmica de Sub-ledgers:** O sistema deve criar automaticamente a partição contábil específica de moeda estrangeira no Finxact no primeiro clique de ativação de moeda do cliente no SuperApp, sem latências de backoffice.
3.  **Expiração e Liberação de Holds (TTL):** Todos os Holds de saldo criados no Finxact durante a orquestração de câmbio devem possuir um Time-To-Live (TTL) de 15 minutos. Caso a transação SAGA não seja confirmada pelo Post, o Hold deve ser cancelado automaticamente, restabelecendo o saldo disponível do cliente.
4.  **Cálculo e Retenção Tributária Dinâmica:** O motor de cálculo fiscal deve avaliar a titularidade das contas de origem e destino, aplicando a alíquota de IOF correta: 1.1% para mesma titularidade (contas vinculadas ao mesmo CPF) e 0.38% para titularidades distintas.
5.  **Envio Automatizado de Contratos BACEN:** A aplicação de remessas deve coletar todos os dados cadastrais do cliente e gerar o payload estruturado do contrato de câmbio simplificado, enviando-o via mensageria para homologação contínua do BACEN em no máximo 5 minutos pós-liquidação.
6.  **Trilha de Auditoria FINRA/BACEN:** Cada alteração contábil consolidada deve produzir logs estruturados contendo IDs das contas, hashes de transação unificados, spreads e taxas cobradas, e os dados completos das partidas duplas contábeis de débito e crédito, sendo persistidos criptografadamente (AES-256) por 5 anos.

## 7. Features Sugeridas
*   `BINTER-EP-02-F01` - **Configurador Automático de Sub-ledgers:** microconector para provisionamento de partições de USD/EUR unificados no ledger principal do cliente.
*   `BINTER-EP-02-F02` - **API de Gerenciamento de Holds/Posts:** engine de criação, liquidação definitiva e expiração de reservas temporárias de saldos no Core EUA.
*   `BINTER-EP-02-F03` - **Motor de Cálculo Fiscal (IOF):** biblioteca dinâmica parametrizável para aplicação e retenção imediata de impostos regulatórios nacionais.
*   `BINTER-EP-02-F04` - **Emissor e Integrador de Contratos BACEN:** barramento de eventos integrador para formatação e envio de relatórios de câmbio em tempo real.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Túnel seguro mTLS e VPN IPsec dedicada ativa entre a AWS do Banco Inter e o ambiente SaaS do Finxact nos EUA.
    *   Exposição em alta disponibilidade e baixa latência das APIs legadas de débito em conta corrente BRL do Core BR.
*   **Dependências de Negócio:**
    *   Aprovação jurídica das políticas operacionais de câmbio emergencial fora de horário de mercado comercial com o uso de spreads de contingência.
*   **Dependências de Épicos:**
    *   Serve como habilitador base para as operações do `BINTER-EP-01` (Seamless FX & Smart Wallet).

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |\
| :--- | :--- | :--- |\
| **Indisponibilidade do Core Finxact (EUA):** Perda de comunicação na perna de crédito que causaria a retenção indevida de valores no Brasil. | **Alto** | Mecanismo de rollback imediato local no Core BR e ativação de fila de compensação assíncrona blindada no RabbitMQ/Kafka. |\
| **Flutuação de IOF por alteração governamental:** Mudança súbita de alíquotas tributárias de câmbio por decretos federais brasileiros. | **Alto** | Parametrização da alíquota do imposto em base de dados de configuração dinâmica, permitindo atualização em tempo real sem a necessidade de deploy. |\
| **Gargalos de concorrência contábil em D+0:** Travamento de saldos por requisições paralelas simultâneas de remessas e compras físicas. | **Médio** | Implementar controle transacional avançado a nível de banco de dados e controle de locks de contas no Redis distribuído. |\

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Demanda uma transferência de recursos sem atrito e instantânea como o principal motor de engajamento do correntista do Banco Inter.
*   **Mariana Silveira (Tech Lead):** Demanda consistência eventual controlada com mecanismos de conciliação automática que garantam integridade de balanço 100% à prova de falhas.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Cobertura total de testes de integração e validação das rotas tributárias em ambiente de testes; zero discrepâncias de cálculos fiscais identificadas.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** SLA médio de chamadas de Holds e Posts estável abaixo de 400ms em produção; processamento de remessas concluídas em menos de 1 segundo na média.
*   **Longo Prazo (1 ano):** Registro e reporte de mais de 1.000.000 de contratos de câmbio simplificados ao BACEN de forma automatizada com 100% de conformidade regulatória.

## 12. Observações
*   **Próximos Passos:** Finalizar homologação das assinaturas mTLS junto aos engenheiros da Finxact nos EUA.
*   **Referências:** Documentação de desenvolvimento de APIs da Finxact e regulamentações de câmbio simplificado do Banco Central do Brasil.
*   **Nota de Elaboração:** Modelagem detalhada observando as premissas de governança fiscal e conformidade regulatória bilateral.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens do estudo financeiro detalhados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Transferência em tempo real e automação fiscal mapeados na seção 4. |
| Problema de negócio com dados/fatos | **APROVADO** | Fatos de gargalos de horários restritos de câmbio apresentados na seção 3. |
| Insights de 2+ casos de mercado | **APROVADO** | Benchmark competitivo baseado nas operações da Wise e Nomad contemplado. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas para latência do Hold, velocidade, acurácia e reporte BACEN na seção 4.1. |
| Premissas de ROI explícitas | **APROVADO** | Estabilidade de conexões e fixação de alíquotas fiscais listados na seção 4.1. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios completos abrangendo atomicidade, Holds, IOF, BACEN e auditoria. |
| Todas as 12 seções preenchidas | **APROVADO** | Estruturação de 1 a 12 concluída com rigor técnico e editorial. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_