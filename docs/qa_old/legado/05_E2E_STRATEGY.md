# 05 — E2E Strategy (E2E) — Prisma

| Campo | Valor |
|-------|-------|
| **UI** | Playwright (recomendado) sobre Vite :5173 |
| **API cross** | FE → Java :8080 → Python :8090 |
| **Data mode** | `VITE_DATA_MODE=live` |

---

## 1. Objetivos E2E

1. Validar jornadas de negócio (não retestar unitários).
2. Provar a regra de ouro: **zero traffic para :8090 no browser**.
3. Cobrir estados de resiliência (`normal` / `empty` / `partial` / `error`).
4. Servir de gate **G2** antes de demo staging.

## 2. Escopo IN / OUT

| IN | OUT |
|----|-----|
| Maria 20 min (EP-02 → 05 → 06) | 56 US × tela |
| Aurora parecer + HITL approve | Neptune real |
| Smoke rede BFF | Performance full load |
| Login lab / bearer demo | OIDC PKCE completo (até P6) |
| a11y smoke shell (já Vitest) | Appium |

## 3. Suítes Playwright

| Suite | Arquivo sugerido | Tags | CI |
|-------|------------------|------|-----|
| `e2e/maria-cut.spec.ts` | Corte 20 min | `@smoke @maria` | PR lab nightly |
| `e2e/aurora-hitl.spec.ts` | Parecer + 2 atores | `@smoke @aurora` | nightly |
| `e2e/bff-network.spec.ts` | Assert hosts | `@contract` | PR |
| `e2e/resilience.spec.ts` | `?state=` | `@resilience` | nightly |

### Fluxo Maria (smoke)

1. Abrir explicação da recusa (motivo + contrafactual visível).
2. Abrir contestação → obter protocolo → ver tracking.
3. Consentimento alt-data → coach / elegibilidade (lab).
4. Em cada passo crítico: screenshot + assert texto canônico (score 486, datas).

### Fluxo Aurora (smoke)

1. Entrar Copiloto PJ / upload ou parecer seed.
2. Disparar geração via BFF (network assert :8080).
3. Submit HITL.
4. Trocar ator (storage/header LAB_ACTOR ou dois contextos).
5. Approve + ver trilha.

## 4. Ambientes

| Env | FE | BE | PY | Auth |
|-----|----|----|----|------|
| local-lab | 5173 | 8080 supabase+infra | 8090 | OIDC off + LAB_ACTOR |
| CI | preview | Testcontainers / services | mock ou compose | tokens de teste |
| staging | Amplify/host | OIDC on | interno | Keycloak real |

## 5. Seletores e estabilidade

- Preferir `data-testid` / roles ARIA do Equifax DS.
- Não acoplar a badge `PRISMA-EP-…` (só `?dev=1`).
- Timeouts: GenAI ≥ 60s; demais 15s.
- Flaky policy: retry 1× só em GenAI; resto = bug.

## 6. Evidências

Cada run smoke grava:

- trace Playwright (on-first-retry)
- video falha
- HAR ou log de URLs (bff-network)
- `correlationId` se 503

## 7. Critério de pronto E2E

- [ ] `@smoke @maria` verde em lab live
- [ ] `@smoke @aurora` verde com 2 atores
- [ ] `@contract` bff-network verde
- [ ] Nenhuma chamada browser → `:8090`
- [ ] EXP-01 exploratório registrado no mesmo build (anexo)
