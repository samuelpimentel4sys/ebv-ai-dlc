# EBV Prisma

Produto **Prisma** (Equifax | BoaVista / EBV) — crédito event-driven, decisão explicável, contestação, portfólio, inclusão e copiloto GenAI PJ.

Repo: `https://github.com/samuelpimentel4sys/ebv-ai-dlc` · pasta `Prisma/`

---

## Visão dos três módulos

| Pasta | Stack | Porta | Dono | Papel |
|-------|-------|------:|------|-------|
| **`frontend/`** | React 18 · Vite 6 · Equifax DS | **5173** | Sofia | Demo / showcase das US-FE (6 épicos, ~59 telas) |
| **`backend/`** | Java 21 · Spring Boot 3 · Hexagonal + DDD | **8080** | Noah | **Único backend público do FE** — APIs R1 + HITL + **BFF GenAI** |
| **`backend-python/`** | Python 3.12 · FastAPI · Hexagonal | **8090** | Emilly | Núcleo GenAI EP-03 (RAG, parecer, ratios, guardrails) — **interno** |

```
┌─────────────┐     ┌──────────────────────────────┐     ┌─────────────────┐
│  frontend   │────►│  backend (Java) :8080        │────►│ backend-python  │
│  Sofia      │     │  Noah                        │     │ Emilly :8090    │
│  :5173      │     │  • EP-01…06 APIs             │     │ • GenAI / RAG   │
└─────────────┘     │  • HITL F04 (submit/approve) │     │ • opinions      │
                    │  • BFF /api/v1/pj/** → :8090  │     └─────────────────┘
                    │  • Liveness, WORM, OIDC…     │
                    └──────────────────────────────┘
                              │
                              ▼
                    Supabase Postgres (mesmo DB)
                    + lab 192.168.31.47 (Redis/Kafka/…)
```

**Regra de ouro:** o browser **não** chama `:8090`. GenAI passa pelo BFF Java.  
Detalhe: [`backend/docs/HANDOFF_SOFIA_BFF_GENAI.md`](backend/docs/HANDOFF_SOFIA_BFF_GENAI.md) · mapa: [`backend/docs/MAPA_HOSTS_FE.md`](backend/docs/MAPA_HOSTS_FE.md)

---

## Estrutura

```
Prisma/
├── frontend/         # React · Vite · Equifax DS (Sofia)
├── backend/          # Java Spring Boot Hexagonal (Noah)
├── backend-python/   # FastAPI GenAI EP-03 (Emilly)
├── .tools/           # Maven local (opcional)
└── README.md         # este arquivo
```

---

## 1. Frontend (`frontend/`)

**O quê:** aplicação de demonstração Prisma — shell, trilhas por persona, telas dos épicos EP-01…EP-06. Design System Equifax (não Foursys UI).

**Integração lab:** base URL do BE = `http://localhost:8080` (incluindo paths GenAI `/api/v1/pj/**`).

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

| Script | Uso |
|--------|-----|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + `dist/` |
| `npm test` | Vitest + a11y |
| `npm run budget` | Budgets DS |

Docs: [`frontend/README.md`](frontend/README.md) · [`frontend/docs/PLANO_TRABALHO_FRONTEND.md`](frontend/docs/PLANO_TRABALHO_FRONTEND.md) · [`frontend/docs/MAPA_FE_VS_BE.md`](frontend/docs/MAPA_FE_VS_BE.md)

---

## 2. Backend Java (`backend/`)

**O quê:** APIs de produto (score, decisão, contestação, consentimento, portfolio, thin-file, HITL PJ, liveness, etc.), Flyway, OIDC Keycloak, adapters lab (Neo4j, ONNX, Fairlearn, MinIO WORM, WireMock Liveness) e **BFF** para o GenAI Python.

**Não faz:** LLM / Bedrock / RAG — isso é Emilly.

### Subir (lab típico)

Infra de produto costuma estar em `192.168.31.47` (Redis, Kafka, Keycloak…). DB = **Supabase** Prisma. Config via `backend/.env` (não versionar).

**Showcase (só Supabase):** `PRISMA_SHOWCASE=true` + `SPRING_PROFILES_ACTIVE=supabase` — ver [`backend/docs/MODO_SHOWCASE.md`](backend/docs/MODO_SHOWCASE.md).

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$mvn = "..\.tools\apache-maven-3.9.6\bin\mvn.cmd"   # ou mvn no PATH

Get-Content .\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $k,$v = $_.Split('=',2)
  Set-Item -Path "Env:$($k.Trim())" -Value $v.Trim()
}

& $mvn spring-boot:run
```

Profiles comuns: `supabase,infra`.

| Recurso | URL |
|---------|-----|
| Health | http://localhost:8080/actuator/health |
| Swagger | http://localhost:8080/swagger-ui.html |
| GenAI health (BFF) | http://localhost:8080/api/v1/pj/genai/health |

Docs-chave:

- [`backend/docs/PLANO_TRABALHO_BACKEND.md`](backend/docs/PLANO_TRABALHO_BACKEND.md)
- [`backend/docs/RELATORIO_PROGRESSO_BACKEND.md`](backend/docs/RELATORIO_PROGRESSO_BACKEND.md) — Lab % ≠ DoD %
- [`backend/docs/MAPA_HOSTS_FE.md`](backend/docs/MAPA_HOSTS_FE.md)
- [`backend/docs/HANDOFF_SOFIA_EP01_FE.md`](backend/docs/HANDOFF_SOFIA_EP01_FE.md)
- [`backend/docs/user-stories/`](backend/docs/user-stories/) — 56 US-BE

Infra Docker opcional (OBS): [`backend/docs/INSTRUCAO_DOCKER_SERVICOS_OBS.md`](backend/docs/INSTRUCAO_DOCKER_SERVICOS_OBS.md) · Liveness mock: [`backend/docs/INSTRUCAO_SERVIDOR_LIVENESS.md`](backend/docs/INSTRUCAO_SERVIDOR_LIVENESS.md)

---

## 3. Backend Python (`backend-python/`)

**O quê:** Copiloto GenAI PJ (EP-03) — extração/docs, RAG + pgvector, ratios, opinions, guardrails, library, group, routing. Mesmo Postgres Supabase do Java.

**Não faz:** alçada / submit / approve / trail — isso é Noah (HITL F04). Status HITL atualizado no DB pelo Java.

```bash
cd backend-python
cp .env.example .env   # DATABASE_URL + provider LLM
uv sync
uv run uvicorn prisma_pj.presentation.main:app --reload --port 8090
```

| Recurso | URL |
|---------|-----|
| Health | http://localhost:8090/health |
| Ready | http://localhost:8090/ready |
| OpenAPI | http://localhost:8090/docs |

Providers: `local` \| `bedrock` \| `openai` \| `gemini` (sem voz).  
Plano: [`backend-python/docs/PLANO_TRABALHO_EP03_PYTHON.md`](backend-python/docs/PLANO_TRABALHO_EP03_PYTHON.md)  
Handoff HITL: [`backend/docs/HANDOFF_EMILLY_NOAH_EP03_F04.md`](backend/docs/HANDOFF_EMILLY_NOAH_EP03_F04.md)

> Em lab com FE: suba Python **antes ou junto** do Java (`PRISMA_GENAI_BASE_URL=http://localhost:8090`). O FE continua falando só com `:8080`.

---

## Ordem sugerida no lab

1. Rede / DNS ok para Supabase (`db.<ref>.supabase.co:5432`)
2. `backend-python` → `:8090`
3. `backend` → `:8080` (`.env` carregado)
4. `frontend` → `:5173`

Smoke BFF: `curl http://localhost:8080/api/v1/pj/genai/health` → JSON Emilly + header `X-Prisma-Bff: genai`.

---

## Épicos (mapa rápido)

| Épico | Domínio | FE | Java | Python |
|-------|---------|:--:|:----:|:------:|
| EP-01 | Score Vivo / eventos | ✓ | ✓ | — |
| EP-02 | Explicável / compliance | ✓ | ✓ | — |
| EP-03 | Copiloto PJ | ✓ | HITL + BFF | GenAI |
| EP-04 | Sala de Risco / grafo | ✓ | ✓ (lab) | — |
| EP-05 | Contestação / console / liveness | ✓ | ✓ | — |
| EP-06 | Thin-file / coach | ✓ | ✓ | — |

---

## Fontes UpStream

Briefing, Arquitetura V2 e DBA V2 no workspace Downstream (`99.DownStream/Resumo do UpStream/`). Catálogo US-BE espelhado em `backend/docs/user-stories/`.

---

## Graphify (backend Java)

```bash
cd backend
graphify . --wiki
graphify query "dependências EP-01 e EP-05"
```
