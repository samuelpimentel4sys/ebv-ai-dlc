# Real-Time Event-Driven AML & KYC — BINTER-EP-04
Etapa 05/06 · v1.02 · 2026-03-30 · Banco Inter

## 1. Identificação
*   **Nome do Épico:** Real-Time Event-Driven AML & KYC
*   **ID do Épico:** `BINTER-EP-04`
*   **Produto:** Plataforma Global de FX / Conta Global Multimoeda
*   **Release:** v1.0
*   **Responsável Técnico:** Mariana Silveira (Engineering Lead)
*   **Sponsor de Negócio:** Thiago Mendes (Diretor de Produtos Globais)
*   **Status:** Aprovado nos Quality Gates

## 2. Resumo do Épico
> Desenvolvimento do motor regulatório transacional de prevenção à lavagem de dinheiro (AML - Anti-Money Laundering) orientado a eventos em tempo real, focado na triagem cadastral nominal de remetentes e beneficiários (PEP, OFAC, UE) via algoritmos fonéticos e no compliance com a Travel Rule sem impactos na latência de uso do SuperApp.

## 3. Contexto / Problema de Negócio
O processamento internacional de divisas e transações transfronteiriças expõe o Banco Inter às severas regulações globais de conformidade financeira, prevenção ao terrorismo e à lavagem de dinheiro. Qualquer facilitação ou falha sistêmica que resulte no trânsito de fundos envolvendo entidades, pessoas ou organizações sob bloqueio ou restrição de sanções de agências governamentais (como o BACEN/COAF no Brasil e a OFAC nos EUA) pode acarretar penalidades contábeis severas, multas multimilionárias e a cassação imediata da licença de operação internacional do banco.
O grande desafio é estabelecer barreiras de triagem preventivas que atuem de forma síncrona com o fluxo de autorização cambial sem degradar a percepção de performance da aplicação (SLA < 5 segundos de ponta a ponta). De acordo com o benchmark de mercado (Wise, Nomad), as plataformas líderes utilizam ferramentas automatizadas de RegTech que realizam a triagem nominal fonética em tempo de execução, reduzindo taxas de falsos positivos que poderiam congestionar o backoffice e barrando fraudes de fracionamento de remessas (Structuring) por meio de regras de inteligência comportamental integradas ao fluxo.

## 4. Proposta de Valor / Benefício
*   **Segurança e Conformidade Ativa:** Proteção do Banco Inter contra infrações regulatórias, assegurando aderência plena às diretrizes da OFAC, BACEN, COAF e reguladores europeus.
*   **Performance Incomparável:** Análise nominal avançada rodando em milissegundos através de dados cacheados, evitando travamentos em transações legítimas.
*   **Trilha Regulatória Completa:** Gravação persistente e segura de logs em conformidade com as regras globais de compartilhamento de informações (Travel Rule).

### 4.1 ROI do Épico
```text
Investimento CapEx Alocado: R$ 500.000,00 (11.9% do total de R$ 4.200.000,00)
VPL Estimado do Programa (12.5% a.a.): R$ 12.450.000,00
TIR do Programa: 148%
Payback Descontado do Programa: 7 meses pós-lançamento
```
**Conclusão Financeira: O investimento de R$ 500.000,00 no motor de AML/KYC protege a integridade operacional da Plataforma Global de FX, blindando o banco de multas milionárias e garantindo a captação contínua de R$ 21.000.000,00 em receitas líquidas de spread no Ano 1.**

#### Métricas SMART Associadas:
1.  **Latência de Triagem Nominal:** Cruzamento fonético nominal de nomes e CPFs concluído em menos de 300ms em 99% das transações.
2.  **Taxa de Falsos Positivos:** Incidência de bloqueios preventivos ou retenções manuais indevidas inferior a 1.8%.
3.  **Tempo de SLA para Liberação:** Avaliação manual e resolução de transações em fila de quarentena em menos de 10 minutos por analista.
4.  **Uptime Operacional do Motor:** Disponibilidade estável do microsserviço de AML de 99.99%.

#### Premissas de ROI:
*   Os feeds e bases de dados de listas de sanções mundiais (Dow Jones, World-Check) serão indexados e armazenados localmente em cache para evitar acessos externos lentos.
*   A equipe interna de conformidade do banco receberá treinamento voltado à consolidação de dados e homologação rápida de homônimos.

## 5. Descrição Detalhada
O sistema atuará de forma síncrona como um gatekeeper mandatório integrado ao orquestrador cambial. O microsserviço receberá os dados do remetente e destinatário final, fará a normalização nominal e processará o score de similaridade fonética contra a base local. Caso a similaridade ultrapasse o limite ou seja identificada uma heurística de fracionamento fiscal, a transação cambial é pausada no orquestrador e direcionada à fila de quarentena.

| Escopo IN | Escopo OUT |
| :--- | :--- |
| Triagem síncrona de nomes e documentos contra listas OFAC, PEP e UE | Execução de processos completos de KYC de novos clientes |
| Algoritmos de comparação fonética aproximada (Jaro-Winkler) | Processos de auditoria predial física corporativa |
| Gravação criptografada de dados estruturados da Travel Rule (AES-256) | Monitoramento de fraudes estritas de cartão de débito (antifraude comum) |
| Portal web para tratamento de quarentenas e quitações manuais | Gestão e estorno contábil de compras físicas contestadas |

## 6. Critérios de Aceite
1.  **Triagem Fonética em Tempo Real:** O microsserviço de conformidade deve cruzar nomes e documentos de remetentes e beneficiários contra as listas restritivas (OFAC, PEP, UE) em tempo de execução inferior a 300ms.
2.  **Parâmetro de Similaridade Jaro-Winkler:** Para busca nominal aproximada, o motor de RegTech deve empregar o algoritmo Jaro-Winkler. Se o score de similaridade for superior a 0.92, o sistema deve direcionar a transação automaticamente para `Quarentena`.
3.  **Retenção e Bloqueio SAGA:** No momento em que uma transação for movida para `Quarentena`, o motor deve disparar um evento ao orquestrador Step Functions para pausar a execução SAGA, mantendo os recursos em estado Hold contábil até a deliberação manual.
4.  **Aderência aos Dados da Travel Rule:** A aplicação de conformidade deve registrar estruturadamente o nome completo, identificação fiscal (CPF/ID), endereço do originador e os dados da conta de destino, aplicando criptografia (AES-256) e mantendo esses registros por no mínimo 5 anos.
5.  **Heurística Antifracionamento (Structuring):** O sistema deve agregar o histórico de transações cambiais efetuadas pelo mesmo CPF nas últimas 24 horas. Se a somatória ultrapassar limites tributários declaratórios de forma fracionada, a transação viva deve ser bloqueada temporariamente para análise.
6.  **Painel de Tratamento de Homônimos (White List):** O portal de compliance deve possibilitar aos analistas o cadastro manual de homônimos legítimos documentados em uma "White List" temporária ou permanente, eliminando bloqueios repetitivos de falsos positivos em remessas recorrentes de mesma titularidade.

## 7. Features Sugeridas
*   `BINTER-EP-04-F01` - **Verificador Nominal Fonético (RegTech):** engine interna de alta velocidade para cruzamento nominativo contra listas locais indexadas de sanções.
*   `BINTER-EP-04-F02` - **Heurística Behavior Structuring Engine:** algoritmos de monitoramento comportamental e acúmulo de volumetria fiscal diária.
*   `BINTER-EP-04-F03` - **Cofre Criptográfico Travel Rule:** módulo de gravação segura e criptografada de metadados regulatórios de transações cambiais.
*   `BINTER-EP-04-F04` - **Portal de Fila de Casos e Quarentena:** console de conciliação web para analistas autorizarem ou recusarem transações retidas.

## 8. Pré-condições / Dependências
*   **Dependências Técnicas:**
    *   Habilitação do fluxo noturno automático de download e sincronização de feeds atualizados da Dow Jones/World-Check.
    *   Setup de chaves criptográficas KMS gerenciadas na nuvem AWS para cifragem dos dados regulatórios.
*   **Dependências de Negócio:**
    *   Aprovação regulatória do limite ideal de Jaro-Winkler e políticas de homônimos junto ao departamento jurídico-legal do Banco Inter.
*   **Dependências de Épicos:**
    *   Consumido de forma prioritária e síncrona pelo `BINTER-EP-01` (Seamless FX & Smart Wallet) na perna inicial da transação cambial.

## 9. Riscos
| Risco Mapeado | Impacto | Mitigação Executiva |\
| :--- | :--- | :--- |\
| **Acúmulo de falsos positivos na quarentena:** Congestionamento da equipe de conformidade gerando atrasos em remessas legítimas. | **Alto** | Ajuste dinâmico de score do algoritmo com base em dados de produção e criação ativa de White Lists para homônimos recorrentes. |\
| **Indisponibilidade de atualização de feeds:** Falha no download de listas restritivas diárias expondo o banco a processamentos ilegais. | **Alto** | Geração de alertas automáticos via Slack/E-mail com severidade de nível 1 em caso de falha do job noturno de sincronização. |\
| **Gargalo de I/O em buscas fonéticas no RDS:** Lentidão de consultas devido ao volume excessivo de queries textuais sob horários de pico. | **Médio** | Armazenamento e indexação das listas restritivas em tabelas Redis optimizadas na memória de cache, reduzindo acessos repetidos ao banco relacional. |\

## 10. Stakeholders
*   **Thiago Mendes (Sponsor):** Demanda uma esteira veloz que evite a interrupção desnecessária de transações de clientes legítimos do SuperApp.
*   **Mariana Silveira (Tech Lead):** Demanda consultas locais indexadas na nuvem para que a verificação de sanções não adicione atrasos perceptíveis no orquestrador central.

## 11. Métricas de Sucesso
*   **Curto Prazo (Até 30 dias pós-Go-Live):** Configuração completa dos índices de busca e cache em Redis; latência em staging inferior a 200ms por consulta fonética.
*   **Médio Prazo (Até 90 dias pós-Go-Live):** Taxa real de falsos positivos estabilizada abaixo de 1.7%; tempo médio de liberação de casos em quarentena abaixo de 5 minutos.
*   **Longo Prazo (1 ano):** Zero infrações ou multas contábeis reportadas e auditorias cambiais nacionais e internacionais concluídas com 100% de compliance legal.

## 12. Observações
*   **Próximos Passos:** Finalizar a integração do painel web corporativo com a autenticação única via Active Directory.
*   **Referências:** Resoluções cambiais e diretrizes de combate à lavagem de dinheiro (PLD/CFT) do COAF/BACEN e recomendações do GAFI (FATF).
*   **Nota de Elaboração:** Modelagem detalhada observando as mais rígidas exigências de conformidade cambial global.

***

### Checklist de Qualidade do Épico (Quality Gates)

| Gate de Qualidade | Status | Evidência / Observação |
| :--- | :--- | :--- |
| ROI presente e completo (6 sub-itens) | **APROVADO** | Sub-itens do estudo financeiro detalhados na seção 4.1. |
| Mínimo de 2 objetivos de negócio | **APROVADO** | Redução de falsos positivos e triagem de sanções instantânea mapeados na seção 4. |
| Problema de negócio com dados/fatos | **APROVADO** | Detalhes sobre os riscos de multas regulatórias internacionais expressos na seção 3. |
| Insights de 2+ casos de mercado | **APROVADO** | Rotinas de RegTech contra Structuring baseadas na Wise e Nomad analisadas. |
| Mínimo de 4 métricas SMART | **APROVADO** | Métricas para latência, falsos positivos, quarentena e uptime descritas na seção 4.1. |
| Premissas de ROI explícitas | **APROVADO** | Uso de caches locais e treinamentos operacionais detalhados na seção 4.1. |
| 5 a 10 critérios de aceite verificáveis | **APROVADO** | 6 critérios completos abordando de Jaro-Winkler a White List na seção 6. |
| Todas as 12 seções preenchidas | **APROVADO** | Todas as seções preenchidas de forma consistente e com viés técnico executivo. |

_Documento elaborado com a skill 05 — Documentação de Épicos · The Visionary · UpStream Foursys_