# Mapa de hosts — FE / Sofia / Emilly / Noah

| Serviço | Host lab | Porta | Dono | Escopo FE |
|---------|----------|------:|------|-----------|
| **Prisma BE Java** | `localhost` ou IP do notebook | **8080** | Noah | Contestação, score, portfolio, **HITL F04**, **Liveness**, OIDC |
| **GenAI Python** | `localhost` | **8090** | Emilly | RAG, parecer, ratios, guardrails, library (EP-03 GenAI) |
| **WireMock Liveness** | `192.168.31.47` | **8093** | Ops/Noah | Mock Rekognition (`LIVENESS_MODE=http`) |
| **Keycloak** | `192.168.31.47` | **8180** | Ops | Realm `prisma` (OIDC) |
| **Neo4j** | `192.168.31.47` | **7687** | Ops | Grafo portfolio lab |
| **ONNX scorer** | `192.168.31.47` | **8091** | Ops | Score lab |
| **Fairlearn** | `192.168.31.47` | **8092** | Ops | Fairness lab |
| **Redis** | `192.168.31.47` | **6380** | Ops | Cache / lockout |
| **Kafka** | `192.168.31.47` | **9094** | Ops | Eventos |

## EP-03 — regra de ouro

```
FE ──► GenAI (parecer/RAG/guardrails) ──► Python :8090
FE ──► HITL (submit/approve/trail)    ──► Java   :8080
```

Java **não** embute LLM. Python **não** decide alçada.

Contrato: [`HANDOFF_EMILLY_NOAH_EP03_F04.md`](./HANDOFF_EMILLY_NOAH_EP03_F04.md)

## Headers lab (OBS-04)

Toda resposta do BE Java em lab inclui:

```http
X-Prisma-Lab: true
```

Não tratar como produção.

## Auth lab

`OIDC_ENABLED=false` → APIs abertas.  
Staging/prod → profile `staging`/`prod` **exige** OIDC on (fail-fast startup).
