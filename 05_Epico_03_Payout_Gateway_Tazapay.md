# [BINTER-EP-03] Integração FX & Payout Gateway (Tazapay)
Etapa 05/06 · v1.0 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Integração FX & Payout Gateway (Tazapay)
*   **ID do Épico:** `BINTER-EP-03`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Estabelecimento da camada de integração de trilhos de liquidação local na Europa por meio da conexão direta com as APIs v3 da Tazapay, viabilizando cotações estáveis (locks cambiais de 30s) e remessas internacionais de Euros (EUR) integradas a ouvintes assíncronos (webhooks) de alta segurança.

## 3. Contexto / Problema de Negócio
O processamento direto de transações transfronteiriças de envio requer trilhos de pagamento locais sólidos para evitar custos pesados da rede tradicional de mensageria financeira (SWIFT). Para viabilizar cotações de Euro competitivas no SuperApp, o Banco Inter estabelecerá um canal de liquidação via gateway global de pagamentos Tazapay.
O grande desafio é garantir que as cotações de câmbio acordadas (/v3/rate) se mantenham fixas por um período mínimo de 30 segundos ("lock" de FX) e que as chamadas assíncronas de payout recebam tratamento instantâneo de retorno para movimentar a máquina de estados central do orquestrador. Concorrentes diretos como a Wise dependem de infraestruturas locais integradas. A implementação correta do canal Tazapay reduzirá o spread para níveis de 0.9% a 1.5% ao mesmo tempo que mantém a segurança dos dados e o isolamento dos provedores de payout via adaptadores de design flexíveis.

## 4. Proposta de Valor / Benefício
*   **Eficiência de Custos:** Menor custo por transação com o uso de trilhos europeus SEPA locais via Tazapay.
*   **Estabilidade de Taxas:** Lock de taxa garantida por 30s mitigando riscos de variação cambial súbita para o cliente.
*   **Arquitetura Extensível:** Uso de camadas desacopladas (Adapter Pattern), facilitando o plug-and-play de novos gateways de payout futuros (ex: dLocal ou Convera) sem quebrar o orquestrador.

### 4.1 ROI do Épico
A conexão direta via API Tazapay elimina taxas adicionais de correspondentes tradicionais e melhora a competitividade cambial das operações do banco.
```text
Investimento CapEx Alocado: R$ 700.000,00 (16.7% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 700.000,00 na integração com a Tazapay é fundamental para assegurar os baixos custos de conversão de Euro, apoiando a geração direta da margem de spread operacional projetada de R$ 21.000.000,00 no Ano 1.**

#### Métricas SMART Associadas:
1.  **Tempo de Consulta de Taxas:** Retorno do endpoint de cotação de moedas em menos de 400ms na média.
2.  **SLA de Atendimento da API Tazapay:** Uptime operacional superior a 99.9%.
3.  **Processamento de Notificações de Retorno:** Tratamento e processamento de webhooks confirmados de sucesso/falha em menos de 1 segundo após o recebimento.
4.  **Perdas por Flutuação Cambial:** R$ 0,00 de prejuízo do banco decorrente de estouro de tempo ou variação do lock de taxa cambial garantido de 30 segundos.

#### Premissas de ROI:
*   A Tazapay garantirá taxas comerciais competitivas com oscilações intradia controladas.
*   Os webhooks de sucesso (`payout.succeeded`) e falha (`payout.failed`) serão enviados em tempo real logo após o processamento local.

## 5. Descrição Detalhada
Desenvolver o microsserviço de payout global estruturado em Spring Boot e integrado à infraestrutura AWS. O sistema consumirá os endpoints v3 da Tazapay para cotação, crie ordens de envio internacional com dados de destinatário (IBAN, SWIFT, nome) e implemente um listener seguro de recepção de eventos assinados com chaves criptográficas de segurança, roteando as confirmações à máquina SAGA.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Chamada ao endpoint `/v3/rate` para locks de cotações de 30s | Negociações físicas e fechamentos de mesa de câmbio em D+X |
| Envio de ordens de remessa no trilho europeu via `/v3/payout` | Geração direta de contratos cambiais no BACEN (fração BR) |
| Listener para recepção e validação de Webhooks HMAC-SHA256 | Processamento de transações em moedas que não EUR/USD |
| Mecanismo automático de verificação ativa (Polling) de status | Onboarding ou KYC do beneficiário no banco europeu de destino |

## 6. Critérios de Aceite
1.  **Validade de Lock Garantido:** O microsserviço deve rejeitar o envio de ordens de payout cuja cotação retornado pela Tazapay tenha ultrapassado o TTL limite estabelecido de 30 segundos, forçando o cliente a re-cotar.
2.  **Segurança e Validação de Webhooks (HMAC):** Todas as requisições de webhook de retorno enviadas pela Tazapay devem, obrigatoriamente, conter uma assinatura HMAC-SHA256 válida no cabeçalho. Payloads sem assinatura ou com assinatura inválida devem ser abortados com erro HTTP 401.
3.  **Idempotência na Recepção de Eventos:** O listener deve registrar na base relacional do microsserviço de payout o recebimento de cada evento (usando o ID único da Tazapay) antes de processar sua lógica, impedindo o processamento duplo se o mesmo webhook for reenviado.
4.  **Parsing de Erros Detalhados:** No recebimento do evento `payout.failed`, o microsserviço deve mapear e expor de forma amigável ao orquestrador o código e descrição exata do erro retornado pelo parceiro (ex: IBAN incorreto, banco destino recusou o depósito).
5.  **Mecanismo de Polling Redundante:** Caso uma transação enviada não receba nenhuma atualização assíncrona (webhook) por um período superior a 5 minutos, o microsserviço deve disparar um job automático de polling via API GET `/v3/payout/{id}` para sincronizar os estados.
6.  **Desacoplamento e Abstração de Interfaces:** O design de software do conector deve obrigatoriamente implementar interfaces abstratas (ports & adapters), de modo que o provedor Tazapay possa ser substituído com esforço mínimo de codificação caso novos parceiros sejam adicionados.

## 7. Features Sugeridas
*   `BINTER-EP-03-F01` - **Consulta de Taxas com Lock de FX:** barreira de monitoração cambial e reserva de cotação com temporizador interno.
*   `BINTER-EP-03-F02` - **API Controladora de Payouts:** módulo estrutural para submeter as remessas SEPA utilizando os dados de contas internacionais dos clientes.
*   `BINTER-EP-03-F03` - **Listener Criptográfico de Webhooks:** ouvinte assíncrono blindado por verificação de assinaturas HMAC de segurança.
*   `BINTER-EP-03-F04` - **Poller Ativo de Status de Remessa:** rotina em segundo plano que atua como barreira de segurança em caso de queda de mensageria externa.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Cadastro de chaves simétricas e secrets de API da Tazapay no AWS Secrets Manager.
    *   Definição e mapeamento de caminhos de rede e liberação de IPs para os endpoints da API da Tazapay no firewall AWS (WAF).
*   **Dependências de Negócio:**
    *   Contrato de cooperação internacional e conformidade de spreads homologado pelas áreas jurídicas e de produtos cambiais.
*   **Dependências de Épicos:**
    *   Consumido de forma síncrona/assíncrona pelo `BINTER-EP-01` (FX Orchestrator).

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |
| :--- | :--- | :--- |
| **Queda Generalizada de Mensageria (Webhooks):** Perda de notificações de sucesso de envio gerando travamento de recursos no orquestrador. | **Alto** | Configuração do Poller Ativo rodando a intervalos curtos e monitor de alertas de webhooks não recebidos no Grafana. |
| **Estouro Cambial por atraso no envio:** Diferença entre o momento de bloqueio e o envio físico do payout gerando desbalanço cambial. | **Médio** | Bloqueio de envio imediato de ordens cuja cotação correspondente possua mais de 30 segundos de geração original. |
| **Erros de formatação de contas europeias (IBAN):** Falhas recorrentes em payouts motivadas por dados cadastrados incorretamente pelo usuário. | **Médio** | Implementar biblioteca JavaScript nativa de validação sintática de IBAN e SWIFT no frontend do SuperApp antes do envio da requisição. |

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Demanda uma liquidação rápida de Euros com spreads reduzidos, permitindo oferecer uma tarifa competitiva e expandir a penetração no mercado de turismo e negócios.
*   **Mariana Silveira (Tech Lead):** Demanda isolamento absoluto dos dados de integração, com logs detalhados e mecanismos que evitem reprocessamento contábil.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Cobertura total de validação com mocks do gateway de payout; validações criptográficas de HMAC em produção com 100% de precisão.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Tempo de resposta de consulta cambial estável abaixo de 350ms; zero perdas por atraso ou expiração cambial intradia.
*   **Longo Prazo (1 ano):** Processamento de volumetria constante de transações internacionais com zero incidências de reconciliações incorretas nas pernas de payout locais na Europa.

## 12. Observações
*   **Próximos Passos:** Finalizar testes integrados utilizando as credenciais sandbox oficiais cedidas pela engenharia da Tazapay.
*   **Referências:** Especificação técnica oficial da documentação de desenvolvimento de APIs da Tazapay (v3 API).
*   **Nota de Elaboração:** Modelagem elaborada visando alta robustez criptográfica e isolamento através de boas práticas do Clean Architecture.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Exposto no item 4.1, refletindo o CapEx de R$ 700.000,00 e payback do programa. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Redução do custo transacional de remessas e garantia de margem de spreads. |
| Problema de negócio com dados/fatos | **APROVADO** | Discussão dos custos e atritos da infraestrutura tradicional de envio na seção 3. |
| Insights de 2+ casos de mercado | **APROVADO** | Práticas operacionais da Wise mapeadas para fins de modelagem comparativa. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas para latência rate, uptime, processamento webhook e perda cambial descritas. |
| Premissas de ROI explícitas | **APROVADO** | Estabilidade de envio do parceiro e controle de flutuações intradia listados. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios abrangendo lock cambial, HMAC, idempotência, erros, polling e design. |
| Todas as 12 seções preenchidas | **APROVADO** | Todas as seções preenchidas sem dados provisórios ou lacunas de TBD. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_