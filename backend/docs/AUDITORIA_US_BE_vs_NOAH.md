# Auditoria US-BE × Entrega Noah — Prisma Backend

| Campo | Valor |
|-------|-------|
| **De** | Escritor Back (BMAD UpStream) |
| **Para** | Noah (`dev-java-esp`) |
| **Produto** | EBV Prisma · Equifax/BoaVista |
| **Repo** | `Prisma/backend` |
| **US-BE (fonte)** | `99.DownStream/Resumo do UpStream/User Stories/Backend` — **56** US |
| **Data** | 2026-07-28 |
| **Tipo** | Auditoria de contrato (paths + RN + DoD) vs código lab |

---

## 0. Veredito (leitura obrigatória)

**Superfície REST Java: alinhada aos âncoras das US (lab skeleton).**  
**DoD rigoroso das US: não fechado (~0% “US Done”; lab médio ~35–55%).**

| Dimensão | Nota |
|----------|------|
| Hexagonal / ports / Flyway | Forte |
| Paths `/api/v1/**` Java-owned | Forte (~146 endpoints) |
| Comportamento = RN + integrações da US | Fraco (stubs / `*LabService`) |
| Pronto para aceite cliente / produção | **Não** |

**Regra de linguagem (obrigatória daqui pra frente):**

> `lab-ready` / `esqueleto R1` ≠ `US Done` / `DoD 100%`.

Não reportar “9/9 concluído” sem qualificar **lab**. Seu próprio `RELATORIO_PROGRESSO_BACKEND.md` já diz DoD 0/10 no EP-01 — manter essa honestidade em handoffs para FE (Sofia) e Emilly.

---

## 1. Escopo auditado

| Item | Evidência |
|------|-----------|
| US-BE | 56 arquivos `PRISMA-EP-0*-F**-US-BE-01_*.md` + 6 índices |
| Código | 37 controllers · domain/application/infrastructure/presentation · Flyway V1–V51 |
| Autodeclaração | `RELATORIO_PROGRESSO_BACKEND.md`, `PLANO_TRABALHO_BACKEND.md`, `DEV_RECORD_*` |
| Testes | ~140 unitários PASS (surefire local) · ~52 classes `*Test` |
| Extra | Liveness `/api/v1/auth/**` (V51) — escopo Nexus/biometria, fora do mapa F01 “tracking” do índice Prisma EP-05 |

---

## 2. Scorecard por épico

| Épico | Ownership Java | Superfície | Profundidade vs US | DoD |
|-------|----------------|------------|--------------------|-----|
| **EP-01** Score Vivo | 10/10 features tocadas | Âncoras OK | Kafka/Feast/ONNX/S3/OTel/Airflow stub ou ausentes | **0/10** |
| **EP-02** Explicável | 10/10 | OK | SHAP / DiCE / PDFBox / Fairlearn / Spark = stub | Lab |
| **EP-03** Copiloto PJ | **só F04** | `submit` / `approve` / `trail` | F01–F03, F05–F09 = **Emilly (Python :8090)** | F04 lab; resto N/A Java |
| **EP-04** Portfólio | 9/9 paths | 26 endpoints | `*LabService` — sem Neptune/Trino/Iceberg | Lab |
| **EP-05** Contestação/Console | 9/9 + liveness | OK | Sem Camunda / ClamAV / S3; SLA dias corridos | ~35–45% |
| **EP-06** Inclusão/Coach | 9/9 | OK | ONNX / consent gate / adapters reais pendentes | Lab |

---

## 3. O que está bem (manter)

1. Arquitetura hexagonal consistente (ports in/out por BC).
2. Flyway denso (V1–V51) alinhado às features.
3. Paths dos índices EP-01 / EP-04 / EP-05 batem com controllers.
4. **EP-03 F04:** RNs do handoff Emilly presentes (`READY_FOR_REVIEW`, bloqueio guardrail `FAILED`, RN003 criador ≠ aprovador, ESCALATE).
5. Unit tests verdes; DEV_RECORDs transparentes sobre stubs.
6. Separação correta Java HITL × Python GenAI (não embutir LLM no Spring).

---

## 4. Achados (contexto para os pontos de observação)

1. **Semântica “entregue”** cobre API + DDL + stub — não cobre integrações/DoD da US.
2. **WORM** = FS local (`./data/...`), não S3 Object Lock Compliance.
3. **Score/decisão** = thresholds stub; XAI/contrafactual factories stub.
4. **EP-04** = fachada sintética (`GraphLabService`, `ContagionLabService`, etc.).
5. **EP-03** GenAI não está (e não deve estar) no Java — FE deve chamar Python; documentar explicitamente.
6. **OIDC off** + `LAB_ACTOR` default no `PjHitlController` enfraquecem CTs de auth.
7. Testes = unitários finos; faltam contratos HTTP / CTs das US / E2E infra.
8. Dívida git: slices EP-02/04/05/06 lab frequentemente **sem commit**.
9. Índices US **EP-02** e **EP-06** sem mapa `/api/v1/` (gap UpStream — não bloqueia código, atrapalha auditoria).

---

## 5. Pontos de observação — Noah precisa aplicar

Cada item é **ação obrigatória**. Status sugerido: `[ ]` aberto · `[x]` feito · marcar no próximo DEV_RECORD.

### P0 — Governança e comunicação (hoje)

| ID | Ponto de observação | Ação concreta |
|----|---------------------|---------------|
| **OBS-01** | Qualificar todo status de feature | Em `RELATORIO_PROGRESSO_BACKEND.md` e handoffs: colunas **Lab %** e **DoD %** separadas. Nunca “concluído” sem DoD. |
| **OBS-02** | Congelar escopo EP-03 no Java | README / OpenAPI tag: Java = **somente** F04 HITL. GenAI = `backend-python:8090`. Linkar `HANDOFF_EMILLY_NOAH_EP03_F04.md`. |
| **OBS-03** | Commit do skeleton lab | Commit/push (quando liberado) com mensagem clara: `lab(skeleton): EP-02/04/05/06 stubs — not DoD`. Tag sugerida: `lab-skeleton-2026-07-28`. |
| **OBS-04** | Flag lab no contrato | Responses ou header `X-Prisma-Lab: true` (ou campo `lab: true` no body) em endpoints stub/LabService — FE/Sofia não assume produção. |

### P1 — Segurança e identidade (antes de demo staging)

| ID | Ponto de observação | Ação concreta |
|----|---------------------|---------------|
| **OBS-05** | Remover bypass perigoso em staging | Profile `staging`/`prod`: `OIDC_ENABLED=true` obrigatório. Falhar startup se false. |
| **OBS-06** | Eliminar `LAB_ACTOR` default fora de lab | Em `PjHitlController`: default UUID **somente** se `prisma.lab.actor-fallback=true`. Com OIDC on: `actorId` = JWT `sub` apenas. |
| **OBS-07** | Smoke CT-auth | Script/smoke: 401 sem token, 403 role errada, 200 role correta — pelo menos EP-01 decisions + EP-03 HITL + EP-05 disputes. |

### P1 — Contratos e testes vs US

| ID | Ponto de observação | Ação concreta |
|----|---------------------|---------------|
| **OBS-08** | Matriz CT mínima (prioridade R1) | Implementar/automatizar CTs das US para: **EP-01 F04, F05** · **EP-03 F04** · **EP-05 F01, F02**. Assert: status HTTP + campos obrigatórios do contrato US. |
| **OBS-09** | Suite de contrato REST | Adicionar testes `@SpringBootTest`/`MockMvc` ou RestAssured por controller âncora (não só unit de service). Meta: ≥1 teste HTTP por US Java-owned P1. |
| **OBS-10** | Checklist DoD por US no DEV_RECORD | Todo `DEV_RECORD_*` deve ter seção: **DoD US** com checkboxes copiados da US (integrações, SLO, WORM real, etc.) — não só “Entregue”. |

### P2 — Fechar gaps técnicos R1 (EP-01 / EP-02 / EP-05)

| ID | Ponto de observação | Ação concreta |
|----|---------------------|---------------|
| **OBS-11** | WORM real | Trocar FS local por S3 Object Lock (Compliance) nos paths F04 EP-01, audit F04 EP-02, anexos F08 EP-05. Manter FS só em profile `lab`. |
| **OBS-12** | Score / decisão | Substituir threshold hardcoded por policy versionada (EP-02 F10) + caminho para ONNX/Feast (EP-01 F03/F09). Documentar `partial=true` quando stub. |
| **OBS-13** | Kafka / eventos | Profile `infra`: F01 publication ordenada real; lab stub isolado. `GET /streams/health` deve refletir modo real vs stub. |
| **OBS-14** | Observabilidade F08 | OTel traces + métricas p95 reais; error budget não só SQL nearest-rank lab. |
| **OBS-15** | EP-05 workflow / evidências | Camunda (ou BPMN equivalente) para F02; ClamAV + Object Lock para F08; SLA em **dias úteis EBV** (hoje: dias corridos). |
| **OBS-16** | EP-02 XAI / dossiê / fairness | Substituir stubs: SHAP (ou serviço XAI), DiCE, PDFBox real, Fairlearn/job assíncrono — ou port out explícito para serviço Python com contrato versionado. |

### P2 — EP-04 e EP-06 (não vender como pronto)

| ID | Ponto de observação | Ação concreta |
|----|---------------------|---------------|
| **OBS-17** | EP-04: rotular LabService | OpenAPI `@Tag` / summary: `(lab stub — sem Neptune)`. Não apresentar Sala de Risco como DoD até grafo real + OLAP. |
| **OBS-18** | EP-04: plano de substituição | Issue/DEV_RECORD: Neptune (F01/F02/F06) · Trino/Iceberg (F03/F05) · storage reports (F08). Até lá, `DoD %=0`. |
| **OBS-19** | EP-06: consent gate fail-closed | Ingest alt-data (F01) deve falhar sem consentimento ativo (hoje gap declarado). |
| **OBS-20** | EP-06: thin-file / drift | Modelo real ou adapter ONNX; monitoring F09 sem métricas inventadas. |

### P3 — Higiene e handoffs

| ID | Ponto de observação | Ação concreta |
|----|---------------------|---------------|
| **OBS-21** | Tabela Java:8080 vs Python:8090 | Publicar em `docs/` 1 página “mapa de hosts” para Sofia/FE (EP-03). |
| **OBS-22** | Liveness vs EP-05 F01 Prisma | Separar no relatório: Liveness = US Nexus/biometria; F01 índice Prisma = tracking contestação. Não misturar % de conclusão. |
| **OBS-23** | Pedir ao Escritor Back** | Completar mapa de endpoints nos índices EP-02 e EP-06 (gap UpStream) — facilita próxima auditoria. |
| **OBS-24** | Atualizar `PLANO_TRABALHO_BACKEND.md` | Marcar itens Sprint 0 ainda abertos (OpenAPI/health/.gitignore se pendentes) e refletir lab vs DoD. |

---

## 6. Ordem sugerida de execução (Noah)

```text
1. OBS-01, OBS-02, OBS-04     → comunicação + contrato lab
2. OBS-03                     → commit/tag skeleton
3. OBS-05, OBS-06, OBS-07     → segurança staging
4. OBS-08, OBS-09, OBS-10     → CT / contrato / DoD nos records
5. OBS-11 → OBS-16            → hardening R1 (EP-01/02/05)
6. OBS-17 → OBS-20            → EP-04/06 honestidade + próximos adapters
7. OBS-21 → OBS-24            → higiene contínua
```

---

## 7. Critério de re-auditoria

Escritor Back considera **US Java parcialmente aceita** quando, para cada US P1:

1. Path + método + status HTTP batem com a US.
2. RNs críticas cobertas por teste automatizado (não só comentário).
3. Integração declarada na US existe **ou** há ADR + flag lab + DoD % documentado.
4. OIDC on em ambiente de demonstração.
5. DEV_RECORD com checklist DoD da US preenchido.

**Meta intermediária (próximo checkpoint):** fechar **OBS-01…OBS-10** + **OBS-11** (WORM path lab vs prod) antes de nova auditoria completa.

---

## 8. Referências

| Documento | Uso |
|-----------|-----|
| `docs/RELATORIO_PROGRESSO_BACKEND.md` | Status lab atual (Noah) |
| `docs/PLANO_TRABALHO_BACKEND.md` | Plano sprints |
| `docs/HANDOFF_EMILLY_NOAH_EP03_F04.md` | Contrato Java ↔ Python F04 |
| `docs/DEV_RECORD_*.md` | Evidência por feature |
| US-BE pasta Downstream | Fonte de verdade de contrato |

---

_Gerado por Escritor Back · Auditoria contrato US-BE × código Noah · 2026-07-28_  

---

## 9. Ack Noah — pacote OBS-01…11 (2026-07-28 20:15)

Veredito aceito. Pacote P0/P1 comunicação + segurança lab aplicado.

| ID | Status |
|----|--------|
| OBS-01…11 | [x] ver [`DEV_RECORD_AUDITORIA_OBS.md`](./DEV_RECORD_AUDITORIA_OBS.md) |
| OBS-21, 22 | [x] mapa hosts + Liveness = Noah BIO (não “Nexus owner”) |
| OBS-12…20 | [ ] próximo ciclo (hardening R1) |

Correções à auditoria registradas: skeleton já commitado em `main`; WORM S3 adapter existe (`fs\|s3`); Liveness ownership Noah.

_Próximo passo: OBS-12…16 hardening R1._
