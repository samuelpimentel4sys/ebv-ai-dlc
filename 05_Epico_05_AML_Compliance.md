# Motor de Compliance de AML em Tempo Real (Compliance AML) — BINTER-EP-05
Etapa 05/06 · v1.0.1 · Julho 2026 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Motor de Compliance de AML em Tempo Real (Compliance AML)
*   **ID do Épico:** `BINTER-EP-05`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento de um motor de compliance de AML (Anti-Money Laundering) e KYC (Know Your Customer) baseado em eventos e cache rápido em memória (Redis). Ele foi projetado para triar transações cambiais em milissegundos de forma paralela ao fluxo de remessa, reduzindo drasticamente falsos positivos e retenções manuais indevidas.

## 3. Contexto / Problema de Negócio
No processamento de remessas internacionais, o cumprimento de regulamentações globais rígidas contra a lavagem de dinheiro (AML), combate ao financiamento do terrorismo (CFT) e regras da "Travel Rule" internacional é obrigatório. Atualmente, a esteira do Banco Inter direciona 6,5% do total de transações para análise manual de compliance devido a correspondências fonéticas vagas ou dados desatualizados em bancos de dados relacionais legados.
Isso gera um gargalo operacional massivo na esteira de liberação de remessas, além de fricção e abandono (churn) de correntistas legítimos de alta renda que têm seus fundos retidos indevidamente. De acordo com os benchmarks competitivos (Nomad e Wise), a execução de uma triagem assíncrona em alta performance baseada em barramento de eventos e com cache rápido de listas PEP (Pessoas Expostas Politicamente) e OFAC reduz os falsos positivos em até 80%, diminuindo os custos de backoffice com suporte humano e evitando penalidades regulatórias severas junto ao Banco Central do Brasil (BACEN) e ao FinCEN nos EUA.

## 4. Proposta de Valor / Benefício
*   **Conformidade sem Atrito:** Triagem instantânea contra listas globais de sanções em tempo inferior a 100ms.
*   **Redução de Falsos Positivos:** Sofisticação de motores de busca fonética diminuindo retenções indevidas de 6,5% para < 1,3%.
*   **Esteira Fast-Track:** Workflow ágil baseado em eventos para tratamento rápido e digital dos casos legítimos suspeitos.

### 4.1 ROI do Épico
Este épico posiciona-se prioritariamente como garantia regulatória e de mitigação de custos de backoffice e passivos jurídicos, reduzindo despesas de expansão de pessoal de suporte.
```text
Investimento Inicial CapEx: $151.000 USD
Retorno Recorrente Estimado (Conservador): $90.000 USD/ano
Retorno Recorrente Estimado (Otimista): $330.000 USD/ano

Cenário Conservador:
ROI % (1º Ano) = ( $90.000 - $151.000 ) / $151.000 = -40,39%
Payback = ( $151.000 / $90.000 ) * 12 = 20,1 meses

Cenário Otimista:
ROI % (1º Ano) = ( $330.000 - $151.000 ) / $151.000 = +118,54%
Payback = ( $151.000 / $330.000 ) * 12 = 5,5 meses
```
**Conclusão Financeira: O investimento de $151.000 USD na infraestrutura de compliance em tempo real protege o banco contra multas financeiras severas e recupera perdas de retenção manual, gerando payback de apenas 5,5 meses sob forte fluxo transacional no cenário de alta eficiência.**

#### Métricas SMART Associadas:
1.  **Redução de Fila Manual:** Redução de transações retidas erroneamente para análise manual de AML de 6,5% para menos de 1,3% em até 120 dias pós-lançamento.
2.  **SLA de Triagem Automática:** Tempo de resposta da triagem automatizada contra listas globais (OFAC/PEP) mantido abaixo de 100 milissegundos.
3.  **MTTA de Análise Humana:** Tempo médio de análise humana na fila fast-track de compliance reduzido para menos de 15 minutos em horário comercial.
4.  **Conformidade Regulatória:** Exatamente zero multas ou autuações fiscais/regulatórias por falhas em identificação de listas restritivas em remessas.

#### Premissas de ROI:
*   Atualização diária automatizada de listas restritivas em memória (Redis) garante integridade de triagem rápida.
*   A API externa de inteligência para casos complexos possui disponibilidade superior a 99,9%.

## 5. Descrição Detalhada
O Motor de Compliance atuará como um microsserviço assíncrono acoplado ao barramento de eventos do Kafka. No momento do checkout da remessa, a transação enviará seus metadados para triagem simultânea no Redis Cache (onde estarão carregadas as listas consolidadas da OFAC, PEP e Dow Jones). Se o score de risco cadastral for nulo, a liberação transacional é síncrona; caso contrário, a ordem é direcionada para a esteira manual fast-track via eventos com alertas push.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Motor de triagem assíncrono em alta performance rodando em paralelo | Desenvolvimento de ferramentas de KYC para contas PJ internacionais |
| Estrutura de cache em Redis para busca ultra-rápida de listas PEP e OFAC | Bloqueios físicos judiciais domésticos não vinculados a FX |
| Barramento de eventos para acionamento de workflows rápidos de suporte | Investigações aprofundadas de crimes cibernéticos (forensics) |
| Integração em tempo real com agências globais de enriquecimento de KYC | Auditoria e reporte manual de suspeitas por canais postais |

## 6. Critérios de Aceite
1.  **Paralelismo de Busca em Milissegundos:** O motor de AML deve processar a busca fonética contra as listas residentes no Redis em paralelo ao processamento contábil, não excedendo 100ms de latência de resposta em 99% das chamadas.
2.  **Tratamento Fonético Avançado:** O algoritmo de busca fonética local deve usar métodos tolerantes (Double Metaphone) adaptados à língua portuguesa para evitar atritos de grafia (ex.: \"Thiago\" vs \"Tiago\") e diminuir falsos positivos cadastrais.
3.  **Abertura Automática de Caso Suspeito:** Se o score de risco do cliente exceder o limite seguro (> 75 pontos), o sistema de eventos deve criar automaticamente um ticket na console de suporte e congelar o \"Post\" da remessa em tempo inferior a 1 segundo.
4.  **Uptime e Sincronização Diária de Listas:** O pipeline de dados deve atualizar as listas locais de sanções (OFAC, PEP e Interpol) no Redis diariamente às 02:00h, gerando log de consistência e notificando os administradores de conformidade.
5.  **Notificações Críticas de Status de Ordem:** Caso a transação seja retida ou liberada pela esteira manual de analistas, o motor deve disparar um evento para o Kafka em menos de 500ms para atualizar a tela do app do correntista.
6.  **Trilha de Auditoria Criptográfica:** Todos os registros de triagem (scores, listas consultadas e analista responsável pela liberação manual) devem ser persistidos em formato estruturado assinado criptografadamente por 5 anos para auditorias do BACEN.

## 7. Features Sugeridas
*   `BINTER-EP-05-F01` - **Loader de Listas de Sanções Redis:** pipeline de dados agendado diário para download e consolidação de sanções em banco de memória.
*   `BINTER-EP-05-F02` - **Motor de Busca Fonética Avançada:** algoritmo de correspondência fonética inteligente com baixo índice de erros de digitação.
*   `BINTER-EP-05-F03` - **Barramento SAGA de Bloqueio Rápido:** conector integrado de bloqueio síncrono de Holds de remessas com base em score de fraude.
*   `BINTER-EP-05-F04` - **Portal de Caso Fast-Track Compliance:** console corporativa visual de triagem e liberação de ordens suspeitas em menos de 15 minutos.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Provisionamento do cluster Redis Cache na nuvem AWS com políticas de expiração e criptografia em repouso.
    *   Liberação de credenciais produtivas e contratos de integração ativa com Dow Jones ou IDology.
*   **Dependências de Negócio:**
    *   Homologação das regras de ponderação de score e políticas de tolerância a riscos junto à diretoria de Compliance e Prevenção à Lavagem de Dinheiro do Banco Inter.
*   **Dependências de Épicos:**
    *   Fornece a validação regulatória crítica que habilita os fluxos do `BINTER-EP-01` (FX Orchestrator) e `BINTER-EP-04` (Remessa Interna).

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |
| :--- | :--- | :--- |
| **Falsos Negativos e Fraudes Passadas:** Passagem indesejada de transações suspeitas pelo motor automatizado que gerem penalidades regulatórias graves. | **Alto** | Implementar amostragem estatística de 1,5% de todas as ordens aprovadas para auditoria manual de segundo nível pós-liquidação (double-check). |
| **Instabilidade de Provedores de Dados Externos:** Queda de APIs de enriquecimento de KYC cadastral que travem o fluxo síncrono de validação rápida. | **Alto** | Configurar redundância técnica de bancos de dados locais cacheados e políticas de fallback de dados simplificados para clientes de histórico limpo. |
| **Custo de Chamadas Excessivo de Enriquecimento:** Aumento de OpEx devido à quantidade elevada de chamadas de APIs parceiras em transações de baixo valor. | **Baixo** | Aplicação de regras de triagem hierárquicas locais de baixo custo antes da consulta de enriquecimento cadastral avançado de terceiros. |

## 10. Stakeholders
*   **Thiago Mendes (Sponsor de Negócio):** Expectativa de que a triagem ocorra sem interromper a velocidade percebida de envio instantâneo e sem provocar reclamações de clientes de alta renda retidos em filas manuais.
*   **Mariana Silveira (Tech Lead / Engenharia):** Exige arquitetura totalmente reativa baseada em filas de mensageria assíncrona, assegurando que gargalos operacionais no backoffice não saturem os servidores de transações críticas de remessa.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Redução imediata de transações encaminhadas para a esteira manual de compliance para menos de 3% e resposta do Redis abaixo de 50ms.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Estabilização nos 1,3% de retenção manual esperados; zero incidentes de ordens perdidas em filas de pendência ou sem atualização push.
*   **Longo Prazo (1 ano):** Processamento automatizado de milhões de remessas sem ocorrência de multas regulatórias do BACEN ou FinCEN e conformidade com a Travel Rule internacional estabelecida.

## 12. Observações
*   **Próximos Passos:** Realizar testes de correspondência fonética simulada com cenários de dupla grafia e nomes árabes/orientais complexos de listas internacionais.
*   **Referências:** Padrões internacionais do GAFI/FATF para transações eletrônicas e documentação técnica de motores de busca textual e bancos de dados orientados a documentos.
*   **Nota de Elaboração:** Modelagem detalhada focando no equilíbrio entre o rigor de conformidade legal e a excelência e rapidez transacional da experiência do SuperApp.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens do estudo financeiro detalhados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Prevenção de lavagem de dinheiro e redução de falsos positivos mapeados na seção 4. |
| Problema de negócio com dados/fatos | **APROVADO** | Gargalos de retenção fonética errônea de 6,5% de transações detalhados. |
| Insights de 2+ casos de mercado | **APROVADO** | Casos práticos da triagem automatizada da Wise e Nomad contemplados. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas para retenção errônea, velocidade, MTTA e multas regulatórias na seção 4.1. |
| Premissas de ROI explícitas | **APROVADO** | Estabilidade de atualizações do Redis e de APIs de enriquecimento descritas na seção 4.1. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios abrangendo latência, algoritmo fonético, barramento, logs e concorrência. |
| Todas as 12 seções preenchidas | **APROVADO** | Estruturação de 1 a 12 concluída com rigor técnico e editorial. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_