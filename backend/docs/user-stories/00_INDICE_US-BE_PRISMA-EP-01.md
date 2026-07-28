# User Stories Backend — PRISMA-EP-01

**Épico:** Score Vivo Event-Driven & Point-in-Time  
**Agente:** Escritor Back (BMAD UpStream) · **Data:** 2026-07-27  
**Fontes:** `02.Explorer/Output Cursor/Programa/PRISMA-EP-01/*`  
**Stack:** Java 21 · Spring Boot 3 / WebFlux · Apache Kafka (MSK) · Schema Registry Avro · Redis · PostgreSQL 16 · Feast/Iceberg · ONNX · S3 Object Lock · OpenTelemetry  
**Release:** Release 1 (MVP — M1 a M8) · Quick Win · WSJF 5,40

## Índice

| US-ID | Feature | Título | Endpoints | Cx | Prioridade | Arquivo |
| --- | --- | --- | :---: | :---: | :---: | --- |
| `PRISMA-EP-01-F01-US-BE-01` | `PRISMA-EP-01-F01` | Publicação Ordenada de Eventos de Crédito | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F01-US-BE-01_Publicacao_Ordenada_Eventos_Credito.md) |
| `PRISMA-EP-01-F02-US-BE-01` | `PRISMA-EP-01-F02` | Leitura Point-in-Time de Atributos | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F02-US-BE-01_Leitura_Point_in_Time_Atributos.md) |
| `PRISMA-EP-01-F03-US-BE-01` | `PRISMA-EP-01-F03` | Recálculo Incremental Disparado por Evento | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F03-US-BE-01_Recalculo_Incremental_Score.md) |
| `PRISMA-EP-01-F04-US-BE-01` | `PRISMA-EP-01-F04` | Gravação de Snapshot Imutável (decision_id WORM) | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F04-US-BE-01_Gravacao_Snapshot_Imutavel.md) |
| `PRISMA-EP-01-F05-US-BE-01` | `PRISMA-EP-01-F05` | Decisão de Crédito Síncrona (p95 < 250 ms) | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F05-US-BE-01_Decisao_Credito_Sincrona.md) |
| `PRISMA-EP-01-F06-US-BE-01` | `PRISMA-EP-01-F06` | Ingestão Normalizada Multi-Fonte (Open Finance / Cad. Positivo) | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F06-US-BE-01_Ingestao_Normalizada_Multi_Fonte.md) |
| `PRISMA-EP-01-F07-US-BE-01` | `PRISMA-EP-01-F07` | Consolidação de Identidade Dourada (Golden Record) | 3 | G | P1 | [arquivo](./PRISMA-EP-01-F07-US-BE-01_Consolidacao_Identidade_Dourada.md) |
| `PRISMA-EP-01-F08-US-BE-01` | `PRISMA-EP-01-F08` | Coleta e Agregação de Telemetria de Decisão (SLO) | 3 | M | P2 | [arquivo](./PRISMA-EP-01-F08-US-BE-01_Coleta_Telemetria_SLO_Decisao.md) |
| `PRISMA-EP-01-F09-US-BE-01` | `PRISMA-EP-01-F09` | Governança de Versões de Modelo de Score | 3 | G | P2 | [arquivo](./PRISMA-EP-01-F09-US-BE-01_Governanca_Versoes_Modelo.md) |
| `PRISMA-EP-01-F10-US-BE-01` | `PRISMA-EP-01-F10` | Reprocessamento Isolado de Janela Histórica (Replay) | 3 | G | P2 | [arquivo](./PRISMA-EP-01-F10-US-BE-01_Reprocessamento_Isolado_Janela_Historica.md) |

**Total:** 10 US · 30 endpoints · Σ SP = 77

## Mapa de Endpoints

| Método | Path | US |
| --- | --- | --- |
| `POST` | `/api/v1/events/credit` | `PRISMA-EP-01-F01-US-BE-01` |
| `GET` | `/api/v1/events/{eventId}` | `PRISMA-EP-01-F01-US-BE-01` |
| `GET` | `/api/v1/streams/health` | `PRISMA-EP-01-F01-US-BE-01` |
| `GET` | `/api/v1/features/{documento}` | `PRISMA-EP-01-F02-US-BE-01` |
| `POST` | `/api/v1/features/batch` | `PRISMA-EP-01-F02-US-BE-01` |
| `GET` | `/api/v1/features/catalog` | `PRISMA-EP-01-F02-US-BE-01` |
| `POST` | `/api/v1/score/recalculate` | `PRISMA-EP-01-F03-US-BE-01` |
| `GET` | `/api/v1/score/{documento}` | `PRISMA-EP-01-F03-US-BE-01` |
| `GET` | `/api/v1/score/{documento}/history` | `PRISMA-EP-01-F03-US-BE-01` |
| `GET` | `/api/v1/decisions/{decisionId}` | `PRISMA-EP-01-F04-US-BE-01` |
| `GET` | `/api/v1/decisions/{decisionId}/snapshot` | `PRISMA-EP-01-F04-US-BE-01` |
| `POST` | `/api/v1/decisions/{decisionId}/verify` | `PRISMA-EP-01-F04-US-BE-01` |
| `POST` | `/api/v1/decisions` | `PRISMA-EP-01-F05-US-BE-01` |
| `GET` | `/api/v1/decisions/{decisionId}` | `PRISMA-EP-01-F05-US-BE-01` |
| `GET` | `/api/v1/decisions/budget` | `PRISMA-EP-01-F05-US-BE-01` |
| `POST` | `/api/v1/ingest/openfinance/callback` | `PRISMA-EP-01-F06-US-BE-01` |
| `GET` | `/api/v1/ingest/sources` | `PRISMA-EP-01-F06-US-BE-01` |
| `POST` | `/api/v1/ingest/replay` | `PRISMA-EP-01-F06-US-BE-01` |
| `GET` | `/api/v1/identity/{documento}` | `PRISMA-EP-01-F07-US-BE-01` |
| `POST` | `/api/v1/identity/merge` | `PRISMA-EP-01-F07-US-BE-01` |
| `GET` | `/api/v1/identity/candidates` | `PRISMA-EP-01-F07-US-BE-01` |
| `GET` | `/api/v1/observability/slo` | `PRISMA-EP-01-F08-US-BE-01` |
| `GET` | `/api/v1/observability/traces/{decisionId}` | `PRISMA-EP-01-F08-US-BE-01` |
| `GET` | `/api/v1/observability/budget` | `PRISMA-EP-01-F08-US-BE-01` |
| `GET` | `/api/v1/models` | `PRISMA-EP-01-F09-US-BE-01` |
| `POST` | `/api/v1/models/{modelId}/promote` | `PRISMA-EP-01-F09-US-BE-01` |
| `POST` | `/api/v1/models/{modelId}/rollback` | `PRISMA-EP-01-F09-US-BE-01` |
| `POST` | `/api/v1/replay/jobs` | `PRISMA-EP-01-F10-US-BE-01` |
| `GET` | `/api/v1/replay/jobs/{jobId}` | `PRISMA-EP-01-F10-US-BE-01` |
| `POST` | `/api/v1/replay/jobs/{jobId}/abort` | `PRISMA-EP-01-F10-US-BE-01` |

## Ordem de implementação sugerida

1. **F01** barramento + **F07** golden record + **F06** ingestão  
2. **F02** feature store PIT + **F09** model registry + **F03** motor score  
3. **F04** snapshot WORM + **F05** API decisão (p95 250ms)  
4. **F08** SLO/observabilidade + **F10** replay isolado

---

_Documento índice · Escritor Back_
