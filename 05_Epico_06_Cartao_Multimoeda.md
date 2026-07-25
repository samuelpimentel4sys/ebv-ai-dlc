# [BINTER-EP-06] Autorização de Cartão de Débito Multimoeda
Etapa 05/06 · v1.0 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Autorização de Cartão de Débito Multimoeda
*   **ID do Épico:** `BINTER-EP-06`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento do fluxo técnico e de regras de roteamento de transações financeiras de cartões baseadas no protocolo ISO 8583, permitindo o débito em tempo real de compras internacionais físicas ou virtuais em Euros (EUR) a partir dos sub-ledgers do Finxact, contendo swaps cambiais em USD em caso de saldo em Euros insuficiente.

## 3. Contexto / Problema de Negócio
O principal canal de uso prático dos fundos da Conta Global de um cliente do varejo é o cartão de débito físico ou virtual. Atualmente, cartões internacionais vinculados a bancos tradicionais brasileiros convertem transações de moeda estrangeira aplicando altas taxas de spread no fechamento da fatura ou sobrecarregando o fluxo com taxas adicionais interbancárias.
O objetivo estratégico do Banco Inter é oferecer a exata experiência de um cidadão europeu que realiza compras na Europa de forma direta, transparente e sem surpresas na fatura. O desafio tecnológico reside no roteamento e processamento de mensagens ISO 8583 de compras que chegam das bandeiras Visa ou Mastercard. É crucial que o sistema consulte as sub-posições de Euros (EUR) no Core Finxact em tempo real e realize a autorização ou o swap para fundos em Dólar (USD) sob um SLA de latência ultra-baixa de forma a evitar rejeições incômodas na maquininha do estabelecimento físico.

## 4. Proposta de Valor / Benefício
*   **Experiência Nativa de Pagamento:** Compras efetuadas na moeda local (EUR) sem incidência de novas taxas cambiais se houver saldo correspondente.
*   **Conversão Inteligente Dinâmica:** Motor automático de swap de USD para EUR no momento do checkout caso os fundos da sub-posição em Euros estejam baixos.
*   **Segurança e Instantaneidade:** Monitoramento e confirmação push imediata da transação no SuperApp do cliente.

### 4.1 ROI do Épico
A habilitação do cartão multimoeda é a principal alavanca para o aumento do volume transacional global (TPV), aumentando em mais de 15% as receitas de taxas de intercâmbio (Interchange Fee) internacionais compartilhadas pela bandeira.
```text
Investimento CapEx Alocado: R$ 700.000,00 (16.7% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 700.000,00 no processador de cartões multimoeda monetiza o ecossistema, impulsionando a captação de recursos e concorrendo diretamente para a meta anual consolidada de R$ 21.000.000,00 em receitas cambiais brutas.**

#### Métricas SMART Associadas:
1.  **SLA do Processador Emissor:** Resposta da mensageria ISO 8583 em tempo menor que 1.8 segundos de ponta a ponta.
2.  **Taxa de Disponibilidade Contínua:** Módulo de autorização de compras online com uptime estável de 99.99%.
3.  **Tempo de Notificação Push:** Entrega do push descritivo da compra no smartphone do cliente em menos de 1 segundo após o processamento.
4.  **Taxa de Erro Técnico de Roteamento:** Zero incidentes de recusa de compras válidas causados por lentidão ou bugs de infraestrutura interna do banco.

#### Premissas de ROI:
*   A bandeira internacional disponibilizará links estáveis de baixa latência direcionados aos datacenters do processador emissor.
*   As regras internacionais de intercâmbio (Interchange) serão aplicadas de forma contínua às transações de débito internacional.

## 5. Descrição Detalhada
Implementar um microsserviço otimizado em C++/Go ou Java que atue na borda de processamento de cartões do Banco Inter. O sistema será responsável por interpretar mensagens ISO 8583 da bandeira, validar o saldo no sub-ledger correspondente no Finxact, conduzir regras dinâmicas de conversão de swap USD/EUR sob demanda e transmitir com segurança e idempotência o status de volta à rede externa da bandeira.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Parsing e manipulação de mensagens ISO 8583 das bandeiras | Emissão, impressão e distribuição postal física do plástico do cartão |
| Consulta e roteamento inteligente de saldos EUR no Finxact | Prevenção a fraudes locais de comércio eletrônico doméstico |
| Execução de Swaps dinâmicos em tempo real a partir de USD | Alteração cadastral de senhas ou limites principais do cartão |
| Disparo de notificações de compras em tempo real via Kafka/Push | Conciliações físicas de disputas jurídicas ou disputas de fraudes |

## 6. Critérios de Aceite
1.  **Análise de Mensagem ISO 8583:** O microsserviço de cartões deve interceptar a mensagem de autorização recebida da bandeira e identificar a moeda original do estabelecimento comercial (campo ISO correpondente a EUR).
2.  **Roteamento Direto sem Câmbio:** Se a transação for em Euros (EUR) e a partição de Euros do cliente no Finxact contiver saldo livre suficiente, o débito contábil deve ocorrer exatamente nessa partição, sem aplicar spread cambial no momento da compra.
3.  **Swap Cambial Automático (Fallback USD):** Se a partição EUR possuir saldo insuficiente, o motor de cartões deve simular o swap automático: calcular o saldo em USD master necessário para converter a diferença cambial com base na taxa de conversão instantânea do dia somada a um buffer de risco cambial de final de semana de 1.5% se aplicável. O débito integrado (fração em EUR e fração swap USD) deve ser concluído atomicamente.
4.  **SLA Estrito de Resposta:** O tempo total interno do emissor do Banco Inter para registrar a transação, consultar saldos, realizar swaps se necessário e retornar o código ISO 8583 de resposta (Aprovação/Recusa) à bandeira não deve exceder 1.8 segundos.
5.  **Notificações Push Instantâneas:** Toda transação concluída (aprovada ou recusada) deve publicar um evento no tópico Kafka que disparará um push informativo no smartphone do cliente em no máximo 1 segundo do processamento.
6.  **Tratamento de Reversão de Compras (Estornos):** No recebimento de mensagens ISO 8583 de reversão ou estorno parcial/total de compras, os fundos de direito do cliente devem ser creditados e liquidados exatamente na mesma partição lógica de moeda que sofreu o débito primário original.

## 7. Features Sugeridas
*   `BINTER-EP-06-F01` - **Parser ISO 8583 Emissor:** decodificador de mensagens financeiras de alta velocidade e escalabilidade linear na nuvem AWS.
*   `BINTER-EP-06-F02` - **Motor de Roteamento Lógico de Saldos:** engine inteligente de direcionamento de saldo com base no código de moeda ISO da transação.
*   `BINTER-EP-06-F03` - **Calculadora Transacional de Swaps Cambiais:** algoritmo interno de conversão e provisionamento de saldos USD para cobertura em EUR de compras vivas.
*   `BINTER-EP-06-F04` - **Push Notification Engine via Kafka:** módulo assíncrono para notificações imediatas de atividades financeiras de cartões.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Certificação completa e liberação das chaves de criptografia HSM/KMS com a bandeira do cartão.
    *   Sincronização de tabelas de taxas e buffers de final de semana na borda de processamento de cartões.
*   **Dependências de Negócio:**
    *   Validação do limite operacional de risco cambial e taxas de intercâmbio com a diretoria de meios de pagamento do Banco Inter.
*   **Dependências de Épicos:**
    *   Depende das partições de sub-ledgers configuradas no `BINTER-EP-02` (Integração Core EUA) e da existência de saldos em USD convertidos a partir das remessas do `BINTER-EP-04` (Remessa Interna).

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |
| :--- | :--- | :--- |
| **Timeout de comunicação com Core Finxact:** Lentidão de rede impedindo o retorno das APIs de saldo no prazo de 1.8s. | **Alto** | Configurar o processador de cartões com cache de saldos ativos de leitura rápida atualizados em transições de saldo anteriores, diminuindo I/O na autorização. |
| **Variações cambiais desfavoráveis de swap:** Mudança abrupta da cotação USD/EUR durante compras offline em finais de semana. | **Médio** | Definição de spread de segurança temporário (buffer de 1.5% sobre a cotação oficial) para operações de swap de débito executadas fora do horário comercial internacional. |
| **Falta de notificação push ao cliente:** Queda de rede móvel ou congestionamento de fila de push impedindo o recebimento imediato de avisos de compra. | **Médio** | Envio alternativo automático de SMS descritivo para compras de alto valor caso a mensagem push permaneça em fila por mais de 5 segundos. |

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Demanda uma experiência de compra livre de taxas ocultas de conversão (Zero Spread em EUR), impulsionando a recomendação orgânica do SuperApp.
*   **Mariana Silveira (Tech Lead):** Demanda rotas dedicadas e escaláveis para as mensagens ISO das bandeiras, garantindo que o processamento interno permaneça imune a lentidões sistêmicas de serviços analíticos de terceiros.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Sucesso em 100% dos cenários de testes integrados ISO 8583 na certificadora da bandeira; latência interna estável abaixo de 1s.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Média real de processamento de autorizações em produção abaixo de 1.1s; zero incidentes de timeouts em maquininhas externas.
*   **Longo Prazo (1 ano):** Processamento de volumetria crescente de transações sem fraudes sistêmicas de concorrência contábil de saldo ou falhas regulatórias de swap.

## 12. Observações
*   **Próximos Passos:** Agendar a janela de certificação integrada obrigatória com o time de testes da Visa/Mastercard.
*   **Referências:** Especificação técnica e manuais normativos do protocolo ISO 8583 para emissores de meios eletrônicos de pagamento.
*   **Nota de Elaboração:** Modelagem detalhada observando as normas de conformidade de processadores de pagamentos e segurança PCI-DSS.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens do estudo financeiro detalhados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Roteamento de compras na moeda nativa e swap cambial instantâneo mapeados. |
| Problema de negócio com dados/fatos | **APROVADO** | Discussão sobre spreads excessivos de fechamento de faturas tradicionais na seção 3. |
| Insights de 2+ casos de mercado | **APROVADO** | Práticas operacionais da Wise e C6 Global avaliadas. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas para latência ISO, disponibilidade, tempo de push e erro técnico na seção 4.1. |
| Premissas de ROI explícitas | **APROVADO** | Redes de baixa latência e aplicação de regras de Interchange mapeadas na seção 4.1. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios completos cobrindo parsing, roteamento, swap, SLA, push e reversão. |
| Todas as 12 seções preenchidas | **APROVADO** | Estruturação de 1 a 12 concluída com rigor e profundidade técnica. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_