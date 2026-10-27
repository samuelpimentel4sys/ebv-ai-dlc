# 04 — Test Plans Gherkin (TP) — CTs prioritários Prisma

| Campo | Valor |
|-------|-------|
| **Nível** | Contrato API + jornadas E2E (smoke) |
| **Idioma** | Português (Dado / Quando / Então) |
| **Prioridade** | OBS-08 + caminhos Maria / Aurora |

---

## Feature: Decisão e snapshot (EP-01 F05 + F04)

```gherkin
# language: pt
Funcionalidade: Decisão de crédito síncrona e snapshot imutável
  Como motor de crédito Prisma
  Quero persistir decisão reproduzível com snapshot imutável
  Para auditoria e explicabilidade

  Contexto:
    Dado o backend Java em "http://localhost:8080"
    E o titular canônico "Maria Souza" com CPF "12345678901"
    E o profile lab ativo

  Cenário: CT-EP01-F05-01 — caminho feliz cria decision_id
    Dado atributos PIT conhecidos para Maria na data "2026-07-27"
    Quando eu envio POST "/api/v1/decisions" com o payload canônico
    Então a resposta deve ter status 200 ou 201
    E o corpo deve conter "decision_id" não vazio
    E o corpo deve conter "outcome"
    E o header ou corpo deve sinalizar lab quando stub

  Cenário: CT-EP01-F05-02 — reprodutibilidade
    Dado a mesma massa e versão de modelo/política
    Quando eu envio POST "/api/v1/decisions" duas vezes
    Então "outcome" e "model_version" devem ser iguais nas duas respostas

  Cenário: CT-EP01-F04-01 — snapshot recuperável
    Dado uma "decision_id" existente de Maria
    Quando eu envio GET "/api/v1/decisions/{decision_id}/snapshot"
    Então o status deve ser 200
    E o snapshot deve referenciar a mesma "decision_id"

  Cenário: CT-EP01-F04-02 — imutabilidade
    Dado uma "decision_id" existente
    Quando eu envio PUT "/api/v1/decisions/{decision_id}/snapshot"
    Então o status deve ser 405

  Cenário: CT-EP01-F05-03 — sem autenticação em staging
    Dado OIDC habilitado
    Quando eu envio POST "/api/v1/decisions" sem Bearer token
    Então o status deve ser 401
```

---

## Feature: Explicabilidade da recusa (EP-02 — jornada Maria)

```gherkin
# language: pt
Funcionalidade: Explicar recusa de crédito
  Como DPO / atendimento
  Quero motivos e contrafactuais para Maria
  Para responder titular e regulador

  Cenário: CT-EP02-F05-01 — resolve motivo a partir da decisão
    Dado a decision_id da recusa de Maria em "2026-07-27"
    Quando eu consulto o resolve de motivos
    Então recebo ao menos um motivo legível em português
    E o motivo referencia a política/versão aplicável

  Cenário: CT-EP02-F01-01 — explicação SHAP lab
    Dado a decision_id de Maria
    Quando eu solicito a explicação
    Então status 200
    E fatores contribuidores estão presentes
    E se stub, partial ou lab está sinalizado

  Cenário: CT-EP02-F03-01 — dossiê regulatório
    Dado a decision_id de Maria
    Quando eu gero o dossiê
    Então status 201 ou 200
    E um artefato PDF ou URL de download é retornado
```

---

## Feature: HITL Copiloto PJ (EP-03 F04)

```gherkin
# language: pt
Funcionalidade: Alçada de aprovação do parecer GenAI
  Como analista e aprovador PJ
  Quero submeter e aprovar parecer com trilha
  Para crédito Aurora com accountability

  Contexto:
    Dado a empresa "Aurora Alimentos S.A." CNPJ "12345678000190"
    E o BFF GenAI em "/api/v1/pj/**" no Java :8080
    E o núcleo Python :8090 acessível só pelo backend

  Cenário: CT-EP03-F04-01 — submit com guardrail OK
    Dado um parecer em estado elegível e guardrail diferente de FAILED
    E o ator criador "Bruno Tavares"
    Quando eu envio submit para revisão
    Então status de sucesso
    E o estado passa a READY_FOR_REVIEW
    E a trilha registra o evento de submit

  Cenário: CT-EP03-F04-02 — bloqueio guardrail FAILED
    Dado parecer com guardrail FAILED
    Quando eu tento submit
    Então a operação é rejeitada
    E o estado não vira READY_FOR_REVIEW

  Cenário: CT-EP03-F04-03 — RN003 criador ≠ aprovador
    Dado parecer READY_FOR_REVIEW criado por "Bruno"
    Quando "Bruno" tenta aprovar
    Então a operação é rejeitada
    Quando o aprovador "outro ator" aprova
    Então a aprovação sucede
    E a trilha contém approve distinto do submit

  Cenário: CT-EP03-F04-04 — FE não chama Python
    Dado o frontend em live mode
    Quando a jornada Aurora aciona GenAI
    Então todas as chamadas de rede GenAI vão para :8080
    E nenhuma chamada vai para :8090
```

---

## Feature: Contestação (EP-05 F01/F02)

```gherkin
# language: pt
Funcionalidade: Contestação de apontamento indevido
  Como titular Maria
  Quero abrir e acompanhar contestação
  Para corrigir apontamento indevido sem SAC

  Cenário: CT-EP05-F01-01 — abertura gera protocolo
    Dado Maria autenticada (ou LAB_ACTOR em lab)
    E apontamento indevido conhecido na massa
    Quando ela abre a contestação
    Então recebe protocolo no formato esperado
    E status inicial válido na máquina de estados

  Cenário: CT-EP05-F02-01 — tracking por protocolo
    Dado um protocolo existente de Maria
    Quando ela consulta o tracking
    Então vê status atual e histórico ordenado

  Cenário: CT-EP05-F02-02 — transição inválida
    Dado contestação em estado terminal
    Quando uma transição inválida é tentada
    Então status 409 ou 400 conforme contrato
```

---

## Feature: Inclusão thin-file (EP-06 — fecho Maria)

```gherkin
# language: pt
Funcionalidade: Retorno à elegibilidade com dado alternativo
  Como Maria thin-file
  Quero consentir e consumir coach
  Para voltar a ser elegível

  Cenário: CT-EP06-F04-01 — ciclo de consentimento
    Dado Maria sem consentimento ativo para alt-data
    Quando ela concede consentimento
    Então o consentimento fica ativo com finalidade e validade
    Quando ela revoga
    Então ingestão alt-data subsequente é bloqueada

  Cenário: CT-EP06-F02-01 — score thin-file lab
    Dado consentimento ativo e sinais alt-data seed
    Quando o score thin-file é calculado
    Então retorna score e faixa
    E lab/partial sinalizado se ONNX stub
```

---

## Feature: Portfólio contágio (EP-04 — Aurora) — contrato lab

```gherkin
# language: pt
Funcionalidade: Rastrear contágio a partir da Aurora
  Como analista de carteira
  Quero ver exposição encadeada
  Para revisar limites

  Cenário: CT-EP04-F02-01 — propagação lab
    Dado CNPJ Aurora na carteira lab
    Quando consulto propagação/contágio
    Então status 200
    E payload lista nós/arestas ou agregados
    E resposta marcada como lab (sem Neptune DoD)
```

---

## Mapeamento automação

| CT | Camada | Stack sugerida | Sprint |
|----|--------|----------------|--------|
| CT-EP01-* | Contrato | MockMvc / RestAssured | Atual |
| CT-EP02-* | Contrato | MockMvc | Atual |
| CT-EP03-F04-01..03 | Contrato | MockMvc + Py unit | Atual |
| CT-EP03-F04-04 | E2E | Playwright request listener | Atual |
| CT-EP05-* | Contrato | MockMvc | Atual |
| CT-EP06-* | Contrato | MockMvc | +1 |
| CT-EP04-* | Contrato lab | MockMvc | +1 |

Handoff: **GherkinFlow** pode gerar `.feature` + steps a partir deste arquivo.
