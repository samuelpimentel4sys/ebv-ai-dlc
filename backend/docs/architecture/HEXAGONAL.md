# Arquitetura Hexagonal — Prisma Backend

## Regra de dependência

```
Presentation → Application → Domain ← Infrastructure
                              ↑
                         (Ports)
```

- **Domain:** Java puro. Sem Spring, JPA, Kafka.
- **Application:** implementa ports *in*; orquestra; `@Transactional` aqui.
- **Infrastructure:** implementa ports *out* (persistência, messaging, Feast, S3).
- **Presentation:** HTTP only; mapeia DTO ↔ command/query.

## Pacotes por bounded context

Sob `br.com.ebv.prisma` usar subpacotes de feature quando o BC crescer:

| Pacote BC | Responsabilidade |
|-----------|------------------|
| `identity` | Golden record, merge |
| `scoring` | Eventos, PIT features, score incremental |
| `decision` | Decisão síncrona, snapshot WORM, política |
| `explainability` | SHAP, contrafactuais, dossiê (EP-02) |
| `dispute` | Contestação, SLA, evidências (EP-05) |
| `consent` | Consentimento LGPD (EP-06 / ADR-006) |
| `portfolio` | Grafo, estresse, cubos (EP-04) |
| `pj` | HITL/alçada copiloto (EP-03) |

## Caminho quente (DBA V2)

`TITULAR → SCORE_MATERIALIZADO → DECISAO`

Baseline Flyway: `V1__baseline_platform.sql`.

## Referências UpStream

- `03.ARQUITETURA_V2.html` — ADRs, WSJF, topologia
- `12_DBA_V2.html` — entidades, volumetria, motores
- `00_Briefing_Negocio_EBV_Prisma.html` — objetivos de negócio
