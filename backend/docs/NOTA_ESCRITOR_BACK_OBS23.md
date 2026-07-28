# Nota para Escritor Back — OBS-23 (mapa de endpoints EP-02 / EP-06)

**De:** Noah (dev-java-esp)  
**Para:** Escritor Back  
**Data:** 2026-07-28  
**Pedido:** Completar mapa de endpoints nos **índices UpStream** EP-02 e EP-06 (gap que dificulta auditoria US × código).

## Por que

Auditoria `AUDITORIA_US_BE_vs_NOAH.md` OBS-23: índices EP-02/EP-06 incompletos → próxima re-auditoria mais cara.

## O que Noah já tem no código (âncoras REST)

### EP-02 (prefixos típicos sob `/api/v1`)

| Área | Paths (lab) |
|------|-------------|
| Política | `/policies`, publish/diff (F10) |
| Audit trail | trilha WORM ligada a decisões (F04) |
| Motivos | catálogo + resolve (F05) |
| Explain | SHAP stub endpoints (F01) |
| Contrafactual | DiCE simulate (F02) |
| Dossiê | regulatory dossier PDF stub (F03) |
| Human review | queue / decide (F06) |
| Fairness | metrics/alerts analyze (F07) |
| Subject LGPD | subject-requests (F08) |
| Sandbox | policy simulate (F09) |

Fonte viva: OpenAPI `http://localhost:8080/swagger-ui.html` tags Policy / Explain / Fairness / …

### EP-06

| F | Paths |
|---|-------|
| F04 Consent | `/api/v1/consents` |
| F08 Titularidade | link/links/unlink utilities |
| F01 Alt-data | `POST /api/v1/alternative-data/ingest` (+ coverage/quality) — **agora exige `documento` + consent ACTIVE** |
| F02 Thin-file | `/api/v1/thinfile/score`, model-card, `{documento}` |
| F03 Coach | journey/goals/progress |
| F05 Gamificação | missions/progress/achievements |
| F06 Efeito | simulate/history |
| F07 Marketplace | offers/apply/eligibility |
| F09 Monitoring | `/thinfile/monitoring`, `/drift`, `/monitoring/evaluate` |

## Pedido concreto

1. Atualizar índice US-BE EP-02 e EP-06 com **método + path + HTTP** alinhados ao OpenAPI Noah.
2. Marcar lab vs DoD nas células (espelhar veredito auditoria).
3. Avisar Noah quando índices prontos → re-auditoria rápida.

## Não pedir a Noah neste ticket

Reescrever US inteiras — só o **mapa de endpoints** nos índices.
