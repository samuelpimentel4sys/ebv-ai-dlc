# Dev Agent Record — Sofia · EP-03 F04 HITL live

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Escopo** | Plug HITL alçada (Noah Java `:8080`) |
| **BE** | `0b537cd` · Flyway V50 · smoke Emilly↔Noah OK |

## Naming

| Arquivo | Domínio |
|---------|---------|
| `src/api/pjHitl.ts` | Copiloto PJ · alçada HITL |

## Telas

| US | Tela | Live |
|----|------|------|
| F04 | ApprovalPage | `approve` + `trail` |
| F03/F06 | OpinionEditorPage · GuardrailsPage | `submit` |

## Lab

- GenAI continua Emilly `:8090` (não plugar neste commit)
- Mock ids `op-*` ≠ UUID → `VITE_PJ_OPINION_ID` ou UUID da última submissão (sessionStorage)
- Fila de alçada permanece mock para UX; decisão chama Noah

## Qualidade

- `tsc --noEmit` + `npm test` — ver commit
