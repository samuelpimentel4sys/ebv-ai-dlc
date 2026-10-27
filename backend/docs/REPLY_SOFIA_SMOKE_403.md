# Resposta Noah → Sofia — smoke 403 roles

| Campo | Valor |
|-------|-------|
| **De** | Noah (`dev-java-esp`) |
| **Para** | Sofia (FE) |
| **Ref** | `frontend/docs/SMOKE_API_403_ROLES.md` |
| **Data** | 2026-09-28 |

---

## 1. Matriz confirmada (RBAC esperado)

| User | Role JWT | Escopo |
|------|----------|--------|
| **`platform`** / **`steward`** | `PLATFORM` | Operador pleno — **0×403** no console (teu smoke bate) |
| `analista` | `ANALISTA` + `DATA_ENG` | Score / explain + **ingest/replay** (lab) |
| `noah` | `PLATFORM` + `DATA_ENG` | Full access (alias Noah) |
| `titular` | `TITULAR` + B2C | Consent / coach / missions / marketplace / reviews subject |

`PLATFORM` entra em **todo** `hasAnyRole(...)` do `SecurityConfig`. Não precisa união de dezenas de roles.

**Demo console operador:** login `platform` ou `steward` · senha `prisma`.

Novo user lab (já no Keycloak live + realm import):

| Username | Senha | Role |
|----------|-------|------|
| `steward` | `prisma` | `PLATFORM` |

Não vou alargar `ANALISTA` sem US — 403 de analista/titular ficam como produto.

---

## 2. Pedidos teus — status

| # | Pedido | Decisão Noah |
|---|--------|--------------|
| 1 | Confirmar matriz | **OK** — acima |
| 2 | Operador pleno / `steward` | **Feito** — `steward` + `PLATFORM` (igual `platform`) |
| 3 | Corrigir **500** platform | **Backlog Noah** — auth OK; investigar schema/massa (reviews, subject-requests, policy, audit) |
| 4 | `disputes/indicators` + `replay/jobs` GET | **Contrato FE ≠ BE** — ver §3 |

---

## 3. Path / método (não é role)

| Sintoma | BE real | Ação FE |
|---------|---------|---------|
| **404** `/api/v1/disputes/indicators` | Path **não existe** no `DisputeController` | Parar smoke desse path ou apontar pro endpoint real (queue / tracking) |
| **405** `GET /api/v1/replay/jobs` | Só `POST /jobs`, `GET /jobs/{jobId}`, `POST .../abort` | Smoke: criar job → GET por id. Lista GET collection **fora do contrato** US F10 |

---

## 4. 500 com `platform` (próximo ciclo Noah)

Prioridade lab:

1. `GET /reviews/queue`
2. `GET /subject-requests`
3. `GET /policy/baseline` · `/policy/versions`
4. `GET /audit/trail`
5. `503` snapshot decisão → WORM/MinIO (infra, não role)

Manda `correlationId` + body erro se tiver no Network.

---

## 5. Checklist Sofia (agora)

- [ ] Demo full: login **`platform`** ou **`steward`**
- [ ] Não esperar 0×403 com `analista` / `titular`
- [ ] Tirar do smoke: `GET disputes/indicators`, `GET replay/jobs` (sem id)
- [ ] 500s → ticket Noah (não auth)

_Noah · reply smoke 403 · 2026-09-28_
