# [BINTER-EP-04] Motor de Remessa Interna (Core BR -> Core EUA)
Etapa 05/06 · v1.0 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Motor de Remessa Interna (Core BR -> Core EUA)
*   **ID do Épico:** `BINTER-EP-04`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento do motor regulatório e de regras de negócio para a transferência eletrônica de fundos em tempo real entre a conta corrente nacional em BRL (Core BR) e a conta global multimoeda em USD (Core EUA), integrando cálculos fiscais dinâmicos de impostos (IOF) e reporte de contratos cambiais junto ao Banco Central (BACEN) 24/7.

## 3. Contexto / Problema de Negócio
O primeiro passo de qualquer transação transfronteiriça com origem no Brasil é a perna local de câmbio. Tradicionalmente, este processo ocorre em horário bancário estrito (9h às 16h) devido à necessidade de intermediação e fechamentos de contratos manuais, o que frustra o cliente varejista moderno que necessita de liquidez internacional instantânea para viagens ou investimentos em finais de semana e feriados.
Para oferecer uma experiência unificada no SuperApp do Banco Inter, é imperativo automatizar totalmente o motor de conversão inicial, realizando cálculos imediatos de tarifas tributárias brasileiras de IOF de mesma titularidade (1.1%) e gerando eletronicamente os contratos de câmbio simplificados exigidos pelo BACEN. A análise competitiva da Wise e Nomad revela que a velocidade no carregamento de saldo internacional em moeda forte é o maior catalisador de conversão e fidelização de usuários.

## 4. Proposta de Valor / Benefício
*   **Disponibilidade Integral:** Liquidação de câmbio e provimento de saldo em USD na conta global em tempo real (24/7).
*   **Zero Fricção Tributária:** Cálculo inteligente de impostos, mitigando erros fiscais de recolhimento de tributos.
*   **Compliance Automatizado:** Reportes regulatórios gerados sem a necessidade de intervenção humana ou processamentos manuais de backoffice.

### 4.1 ROI do Épico
A automatização do fluxo de remessas e reporte ao BACEN reduz custos operacionais, dispensando equipes de retaguarda de câmbio dedicadas e eliminando penalidades fiscais.
```text
Investimento CapEx Alocado: R$ 600.000,00 (14.3% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 600.000,00 viabiliza a captação e conversão primária de recursos BRL de correntistas em ativos internacionais, suportando diretamente a carteira ativa que proverá as receitas brutas de R$ 21.000.000,00 no Ano 1.**

#### Métricas SMART Associadas:
1.  **Tempo de Liquidação de Saldos:** Débito em BRL e correspondente crédito em USD no Finxact concluído em tempo inferior a 1.0 segundo.
2.  **Precisão nos Cálculos Fiscais:** Exatamente 100% de acerto nas alíquotas de IOF aplicadas (zero erro fiscal).
3.  **Reporte Automatizado ao Regulador:** Emissão e transmissão do contrato de câmbio ao BACEN em até 5 minutos após o processamento da remessa.
4.  **Uptime Operacional das APIs Cambiais:** Disponibilidade contínua do motor de conversão em 99.95% das janelas mensais.

#### Premissas de ROI:
*   A regulamentação cambial brasileira manterá as regras vigentes de imposto (IOF) para remessas internacionais de mesma titularidade.
*   A equipe de compliance cambial homologará a modelagem de fechamento automático de contratos em lotes diários.

## 5. Descrição Detalhada
Desenvolver o microsserviço de remessas cambiais integrado com o ecossistema brasileiro de contas e o Core Finxact nos EUA. A aplicação calculará taxas, executará débitos transacionais atômicos no Core BR do Banco Inter, fará o crédito nas partições contábeis de USD no Finxact e gerará contratos simplificados estruturados com dados completos do cliente em conformidade com as diretrizes do BACEN.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Cálculo em tempo real de IOF sobre as remessas (1.1% ou 0.38%) | Remessas com destino a terceiros em outros bancos globais |
| Integração síncrona com Core BR (débitos) e Finxact (créditos) | Onboarding cambial inicial (responsabilidade do Core BR) |
| Emissão eletrônica e envio automático de contratos BACEN | Transferências diretas em moedas exóticas ou fora de USD/EUR |
| Registro detalhado de logs e tarifas tributárias deduzidas | Emissão de relatórios fiscais personalizados para o Imposto de Renda |

## 6. Critérios de Aceite
1.  **Cálculo Tributário Dinâmico:** O motor fiscal deve calcular e aplicar dinamicamente as alíquotas vigentes: 1.1% para transferências entre contas de mesma titularidade (contas nacionais e globais pertencentes ao mesmo CPF) e 0.38% para os demais fluxos.
2.  **Atomicidade na Movimentação:** O débito de BRL no Core Brasil e o crédito de USD no Finxact devem ocorrer como transação atômica síncrona. Em caso de falha de gravação ou time-out na perna americana, o débito no Core BR deve ser estornado em até 500ms.
3.  **Suporte Operacional 24/7:** O motor de conversão deve aceitar ordens de transferência cambial a qualquer hora do dia ou da noite, incluindo finais de semana e feriados bancários locais e estrangeiros.
4.  **Geração e Reporte Automatizado de Contratos BACEN:** A aplicação deve emitir o contrato de câmbio simplificado e transmiti-lo eletronicamente para o sistema de mensageria que o reporta ao BACEN em no máximo 5 minutos do encerramento da remessa.
5.  **Validação Preventiva de Saldos:** O fluxo de conversão deve validar se o cliente possui saldo disponível em BRL equivalente ao valor solicitado somado aos impostos aplicáveis (IOF) e tarifas. Caso contrário, a operação deve ser abortada imediatamente no frontend sem gerar lançamentos contábeis.
6.  **Trilha de Auditoria Fiscal:** Cada remessa executada com sucesso deve salvar na base de dados o histórico unificado contendo o valor em BRL, a taxa de câmbio e spread aplicados, as alíquotas e valores exatos deduzidos em impostos e o montante final em USD creditado na conta global.

## 7. Features Sugeridas
*   `BINTER-EP-04-F01` - **Módulo de Análise e Execução Fiscal (IOF):** biblioteca dinâmica parametrizável para processar as regras fiscais das remessas cambiais.
*   `BINTER-EP-04-F02` - **API Transacional Core BR <-> Core EUA:** canal de comunicação seguro para processamento coordenado de débito nacional e crédito internacional.
*   `BINTER-EP-04-F03` - **Engine de Emissão Eletrônica BACEN:** módulo integrado para criação automática de contratos simplificados de câmbio corporativo/varejo.
*   `BINTER-EP-04-F04` - **Painel de Auditoria e Fechamentos Contábeis:** console administrativo para equipes financeiras reconciliarem volumes diários de câmbio.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Exposição das APIs legadas de débito em conta corrente nacional do Core BR em ambientes de alta disponibilidade.
    *   Habilitação de acessos de rede e regras no firewall interno para envio de contratos cambiais.
*   **Dependências de Negócio:**
    *   Aprovação jurídica das políticas de aceitação de taxa cambial dinâmica em horários de fechamento da mesa de câmbio (sobretudo finais de semana).
*   **Dependências de Épicos:**
    *   Serve como pré-requisito funcional para o `BINTER-EP-01` (Orchestrator) e fornece a liquidez (saldo em USD) necessária para as transações de cartões do `BINTER-EP-06` (Cartão Multimoeda).

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |
| :--- | :--- | :--- |
| **Alteração na Alíquota Tributária do IOF:** Mudança súbita de alíquotas de IOF pelo governo brasileiro gerando erros em cascata de arrecadação. | **Alto** | Parametrização das regras de taxas em banco de dados dinâmico de configuração rápida de ambiente, permitindo alterações em tempo real sem deploy de código. |
| **Queda do Core BR durante a transação:** Indisponibilidade do sistema brasileiro impedindo o estorno contábil correto da operação cambial. | **Alto** | Implementar fila de contingência assíncrona baseada em filas RabbitMQ/Kafka locais para garantir a consistência final e reprocessamento do estorno. |
| **Falta de liquidez cambial em finais de semana:** Oscilação excessiva de cotação do dólar em momentos sem funcionamento oficial da mesa cambial. | **Médio** | Definição de spread de segurança adicional flutuante em finais de semana para absorver eventuais oscilações cambiais extremas do mercado de balcão internacional. |

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Espera que a remessa imediata 24/7 seja o principal ponto de atratividade para converter correntistas domésticos em clientes ativos da plataforma internacional.
*   **Mariana Silveira (Tech Lead):** Espera que a integração síncrona não gere travamento de processos do core principal e seja resiliente a manutenções preventivas programadas nos canais digitais.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Cobertura total de validação tributária nos testes e homologação concluída sem erros junto ao departamento fiscal do Banco Inter.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Tempo de processamento médio de ponta a ponta abaixo de 700ms; zero discrepâncias de contratos enviados em comparação com os lançamentos de débitos reais.
*   **Longo Prazo (1 ano):** Emissão de mais de 1.000.000 de contratos simplificados de câmbio automatizados com 100% de compliance legal e zero notificações regulatórias negativas.

## 12. Observações
*   **Próximos Passos:** Finalizar testes com cargas extremas simuladas para comprovar o comportamento do estorno transacional do Core BR.
*   **Referências:** Resoluções cambiais e normativas tributárias do Banco Central do Brasil para operações simplificadas de divisas internacionais de varejo.
*   **Nota de Elaboração:** Modelagem detalhada observando as premissas de conformidade financeira e governança fiscal do Banco Inter.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens do estudo financeiro detalhados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Disponibilidade de conversão 24/7 e automatização de reportes regulatórios descritos. |
| Problema de negócio com dados/fatos | **APROVADO** | Discussão dos limites operacionais de horário bancário na seção 3. |
| Insights de 2+ casos de mercado | **APROVADO** | Avaliação das rotinas cambiais automáticas da Wise e Nomad contemplada. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas de SLA para velocidade, precisão fiscal, tempo de reporte e uptime na seção 4.1. |
| Premissas de ROI explícitas | **APROVADO** | Manutenção de alíquotas governamentais e processamento em lote detalhados. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios completos cobrindo alíquotas, atomicidade, operação 24/7, BACEN e validações. |
| Todas as 12 seções preenchidas | **APROVADO** | Estruturação de 1 a 12 concluída com rigor técnico e editorial. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_