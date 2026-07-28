# DEV RECORD — Auditoria OBS ciclo 2 (OBS-12…20 + 23/24)

| Campo | Valor |
|-------|-------|
| **Ref** | [`AUDITORIA_US_BE_vs_NOAH.md`](./AUDITORIA_US_BE_vs_NOAH.md) |
| **Data** | 2026-07-28 |
| **Status** | Pacote P2 honestidade + consent gate |

## Checklist

| ID | Status | Evidência |
|----|--------|-----------|
| OBS-12 | [x] | `ScoreController` + `DecisionController`: `partial` / `lab` / `scoringBackend` |
| OBS-13 | [x] | `GET /streams/health` — mode KAFKA vs LOCAL_STUB + bootstrap + `partial`/`lab` |
| OBS-14 | [~] | Documentado backlog — [`ADR_BACKLOG_OBS_14_15_16.md`](./ADR_BACKLOG_OBS_14_15_16.md) |
| OBS-15 | [~] | Idem ADR (Camunda/ClamAV/SLA dias úteis) |
| OBS-16 | [~] | Idem ADR (SHAP/DiCE/PDF/Fairlearn) |
| OBS-17 | [x] | OpenAPI Portfolio já rotulado lab stub |
| OBS-18 | [x] | Plano Neptune/Trino em [`DEV_RECORD_EP04.md`](./DEV_RECORD_EP04.md) |
| OBS-19 | [x] | `IngestAltDataService` fail-closed + `documento` + purposes ALT |
| OBS-20 | [x] | Thinfile responses `partial`/`lab` + Tag OpenAPI |
| OBS-23 | [x] | Pedido Escritor Back — [`NOTA_ESCRITOR_BACK_OBS23.md`](./NOTA_ESCRITOR_BACK_OBS23.md) |
| OBS-24 | [x] | `PLANO_TRABALHO_BACKEND.md` Sprint 0 + lab vs DoD |

## Contrato alt-data (breaking lab)

`POST /api/v1/alternative-data/ingest` agora exige:

```json
{
  "documento": "12345678901",
  "partnerCode": "CEMIG-MG",
  "utilityType": "ENERGIA",
  "recordCount": 100,
  "errorRate": 0.01
}
```

Pré-condição: consent `ACTIVE` com `purposeCode` ∈ `ALTERNATIVE_DATA` \| `UTILITIES` \| `ALT_DATA` \| `UTILITY_SCORE`.  
Sem consent → `403` `ConsentDeniedException`.

## Lab ≠ DoD

Ciclo 2 **não** fecha DoD de OTel, Camunda, XAI real, Neptune/Trino. Só honestidade + gate LGPD ingest.
