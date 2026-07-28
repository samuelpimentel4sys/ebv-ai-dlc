# ADR backlog — OBS-14 / OBS-15 / OBS-16 (não implementado neste ciclo)

**Status:** Accepted as backlog · Noah 2026-07-28  
**Motivo:** Escopo grande; ciclo atual fecha honestidade lab + consent gate (OBS-12/13/17–20).

## OBS-14 — Observabilidade F08

| Hoje | Alvo DoD |
|------|----------|
| Error budget / p95 nearest-rank SQL lab | OpenTelemetry traces + métricas p95 reais (Java agent ou Micrometer OTLP) |

**Decisão:** manter lab metrics; abrir issue OTel sidecar quando staging existir. Não declarar SLO R1 fechado.

## OBS-15 — EP-05 workflow / evidências

| Gap | Alvo |
|-----|------|
| Workflow contestação lab (FSM Java) | Camunda / BPMN equivalente F02 |
| Anexos FS WORM | ClamAV + Object Lock S3 F08 |
| SLA +7d corridos | Calendário **dias úteis EBV** |

**Decisão:** documentar gap; FSM lab permanece até sprint BPMN.

## OBS-16 — EP-02 XAI / dossiê / fairness

| Stub | Substituição |
|------|--------------|
| SHAP explain | Serviço XAI (Python) com contrato versionado **ou** lib in-process |
| DiCE | Idem |
| PDF dossiê | PDFBox real |
| Fairlearn analyze 202 | Job assíncrono → host Fairlearn já no lab (`192.168.31.47`) |

**Decisão:** port-out explícito para Python preferido (mesmo padrão Emilly EP-03). Até lá: `partial=true` / OpenAPI lab.

## Fora deste ADR

Implementado no ciclo 2: OBS-12 (score `partial`), OBS-13 (streams health), OBS-17/18 (EP-04 tags + plano), OBS-19 (consent gate), OBS-20 (thinfile lab flags).
