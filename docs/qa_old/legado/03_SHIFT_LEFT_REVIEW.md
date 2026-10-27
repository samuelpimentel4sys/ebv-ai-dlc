# 03 — Shift-Left Review (SL) — Critérios de aceite Prisma

| Campo | Valor |
|-------|-------|
| **Foco** | US P0 da matriz de risco + regra Lab≠DoD |
| **Data** | 2026-07-29 |

---

## 1. Achados transversais (todas as US)

| ID | Achado | Severidade | Ação |
|----|--------|:----------:|------|
| **SL-01** | Critérios de aceite misturam DoD produção com lab | Alta | Em cada US: marcar “Lab OK” vs “DoD OK” explicitamente |
| **SL-02** | Falta dado de teste canônico (CPF/CNPJ/decision_id) nos CTs | Alta | Usar fixtures Maria/Aurora/Vega ([`06_TEST_DATA.md`](./06_TEST_DATA.md)) |
| **SL-03** | Auth/roles implícitos (“usuário autenticado”) sem role Keycloak | Alta | Nomear roles: steward, analyst, titular, approver |
| **SL-04** | Edge `partial` / `empty` / `503` pouco citados nas US-BE | Média | Incluir CT de resiliência alinhado ao seletor FE `?state=` |
| **SL-05** | EP-03: ownership Java vs Python ambíguo em alguns DoD | Alta | F04 Java; F01–F03/F05–F09 Python; BFF Java obrigatório |

## 2. Revisão direcionada — pacote P0

### EP-01 F05 — Decisão síncrona

| Critério atual (síntese) | Testável? | Gap |
|--------------------------|:---------:|-----|
| `POST /api/v1/decisions` retorna `decision_id` | ✅ | — |
| p95 &lt; 250 ms | 🟡 | Falta CT de budget no CI (só smoke local) |
| Snapshot imutável associado | ✅ | Ligar F04 no mesmo fluxo CT |
| Mesmos atributos → mesmo resultado | 🟡 | Falta CT de reprodutibilidade com seed fixo |

**Critérios de aceite sugeridos (aditivos):**

1. Dado titular Maria e política/versão fixas, Quando decidir 2×, Então `outcome` e `model_version` idênticos.
2. Dado endpoint de decisão, Quando `OIDC` on e sem token, Então 401.
3. Dado stub lab, Então resposta inclui sinalização lab (`X-Prisma-Lab` ou `lab: true`).

### EP-01 F04 — Snapshot imutável

| Critério | Testável? | Gap |
|----------|:---------:|-----|
| GET snapshot por `decision_id` | ✅ | — |
| PUT/PATCH retorna 405 | ✅ | Garantir CT regressão |
| WORM Compliance S3 | ❌ lab FS | Separar DoD; CT lab só FS + flag |

### EP-03 F04 — HITL alçada

| Critério | Testável? | Gap |
|----------|:---------:|-----|
| Submit só se guardrail ≠ FAILED | ✅ | Manter CT |
| Aprovador ≠ criador (RN003) | ✅ | CT com dois atores |
| ESCALATE path | 🟡 | Cobrir estado intermediário |
| Trail auditável | ✅ | Assert ordem eventos |

### EP-05 F01/F02 — Contestação

| Critério | Testável? | Gap |
|----------|:---------:|-----|
| Abertura com protocolo | ✅ | Seed Maria apontamento indevido |
| Tracking status machine | 🟡 | Tabela de transições válidas/ inválidas |
| Anexo / vírus (ClamAV) | ❌ DoD | Lab: stub + CT “aceita PDF mock” |

## 3. Checklist Shift-Left (usar em refinement)

Para cada User Story nova ou em revisão:

- [ ] Critérios em Gherkin (ou conversíveis 1:1)
- [ ] Roles e permissões nomeadas
- [ ] Massa de dados identificada (IDs canônicos)
- [ ] Caminho feliz + 2 exceções + 1 edge
- [ ] Coluna Lab % vs DoD % no aceite
- [ ] Dependência de épico/feature explícita
- [ ] Métrica observável (status, campo, SLO)
- [ ] Fora de escopo listado (stubs permitidos)

## 4. Ambiguidades abertas (perguntar ao PO / Escritor)

1. Em lab, `decision` stub deve sempre recusar Maria (486) ou seguir threshold configurável?
2. Contestação: SLA em dias úteis ou corridos? (auditoria cita gap)
3. Liveness faz parte do DoD EP-05 contestação ou é BIO separado (OBS-22)?
4. Demo cliente: aceita header `X-Prisma-Lab: true` ou exige profile sem lab flag?
