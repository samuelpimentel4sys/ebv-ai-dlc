# 08 — Smoke / Sanity Release (SM) — Prisma

| Campo | Valor |
|-------|-------|
| **Uso** | Antes de demo, promote lab→staging, ou tag release |
| **Tempo alvo Smoke** | ≤ 25 min |
| **Tempo Sanity** | ≤ 90 min (inclui exploratório curto) |

---

## A. Pré-condições

- [ ] `backend` up `:8080` · health OK
- [ ] `backend-python` up `:8090` · health OK (interno)
- [ ] `frontend` `:5173` com `VITE_DATA_MODE=live`
- [ ] Infra lab mínima: Postgres (Supabase) · Redis/Kafka se feature sob teste
- [ ] Branch/tag identificada · commits conhecidos
- [ ] Linguagem: reportar **Lab** vs **DoD** no resultado

---

## B. Smoke API (10 min) — automatizável

| # | Check | Comando / asserção | OK? |
|---|-------|--------------------|-----|
| S1 | Health Java | `GET /actuator/health` → UP | ☐ |
| S2 | Health Python (via rede interna ou BE) | UP | ☐ |
| S3 | Decisão Maria | `POST /api/v1/decisions` → `decision_id` | ☐ |
| S4 | Snapshot imutável | GET 200 · PUT 405 | ☐ |
| S5 | Explain/motivo | GET resolve/explain → 200 | ☐ |
| S6 | Dispute open+track | protocolo + tracking | ☐ |
| S7 | HITL submit | READY_FOR_REVIEW (guardrail OK) | ☐ |
| S8 | HITL RN003 | mesmo ator approve → fail | ☐ |
| S9 | BFF GenAI | `GET/POST /api/v1/pj/**` via :8080 → 200/201 | ☐ |
| S10 | Auth (se OIDC on) | sem token → 401 em S3 e S7 | ☐ |

Script sugerido: `docs/qa/scripts/smoke-r1.sh` (a criar) ou Newman/httpie.

---

## C. Smoke UI (10 min)

| # | Check | OK? |
|---|-------|-----|
| U1 | Home produto carrega · badge live | ☐ |
| U2 | Trilha Maria: explicação visível (motivo) | ☐ |
| U3 | Contestação: abre e mostra protocolo | ☐ |
| U4 | Aurora: tela copiloto sem erro fatal | ☐ |
| U5 | DevTools: **zero** requests para `:8090` | ☐ |
| U6 | `?state=error` mostra 503 + correlationId | ☐ |

---

## D. Sanity (estendida)

| # | Check | OK? |
|---|-------|-----|
| N1 | Reprodutibilidade: 2 decisões iguais | ☐ |
| N2 | HITL approve com **segundo** ator | ☐ |
| N3 | Trail HITL ordenada | ☐ |
| N4 | Consent EP-06 grant/revoke | ☐ |
| N5 | Portfólio Aurora retorna lab payload | ☐ |
| N6 | Header/`lab` flag presente em stubs | ☐ |
| N7 | CI Maven + Vitest + pytest verde na tag | ☐ |
| N8 | EXP-01 (15 min) — notas anexadas | ☐ |

---

## E. Critérios Go / No-Go

| Resultado | Critério |
|-----------|----------|
| **GO demo lab** | Smoke B+C 100% · falhas só em features marcadas out-of-scope |
| **GO staging** | Smoke + Sanity N1–N7 · OIDC on · OBS-05/06 | 
| **NO-GO** | Qualquer falha S3–S9, U5 (vazamento :8090), ou auth bypass em staging |
| **GO com ressalvas** | Falha só EP-04 profundidade / SHAP stub — documentar Lab% |

---

## F. Template de relatório (copiar)

```
SMOKE/SANITY Prisma — {data} — tag/commit {sha}
Ambiente: lab | staging
Executante: {nome}

Smoke API:  /10
Smoke UI:   /6
Sanity:     /8
Vazamento :8090: SIM / NÃO
OIDC: off | on

Bloqueadores:
-
Ressalvas Lab≠DoD:
-

Veredito: GO | GO c/ ressalvas | NO-GO
```

---

## G. Relação com CI

| Pipeline | O que cobre | O que NÃO cobre |
|----------|-------------|-----------------|
| `backend-ci.yml` | Unit + IT Maven | Jornada UI · BFF live · OIDC |
| FE `ci.yml` | Vitest · budget DS | Live :8080 |
| Este SM | Integração real lab | Carga · chaos |

**Regra:** CI verde ≠ Smoke lab dispensável.
