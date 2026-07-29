# DEV_RECORD — F01 massa sintetica + extracao stub (Emilly)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-07-28 |
| **US** | `PRISMA-EP-03-F01-US-BE-01` |
| **Status** | Lab ✅ (stub sem Textract/S3 real) |

## Massa

Pasta `fixtures/f01/`:

| CNPJ | Empresa | Ano | Doc |
|------|---------|-----|-----|
| `12345678000199` | Alpha Tech | 2025 | `docs/balanco_alpha_2025.txt` |
| `98765432000155` | Beta Metalurgica | 2025 | `docs/balanco_beta_2025.txt` |
| `11222333000181` | Gamma Atacado | 2024 | `docs/balanco_gamma_2024.txt` |

Campos canonicos F05 + 1 campo baixa confianca (`PENDING_REVIEW`) por empresa.

## API

- `POST /api/v1/pj/documents` (multipart: file, cnpj, fiscalYear)
- `GET /api/v1/pj/documents/{id}/extraction`
- `PATCH /api/v1/pj/documents/{id}/correct`

Engine: `synthetic-stub-v1` · threshold `0.85` · storage local `.data/pj-docs/`

## Seed lab

```bash
uv run python scripts/seed_f01_synthetic.py
uv run python scripts/seed_f01_synthetic.py --with-rag   # precisa Ollama
```

Resultado 2026-07-28: **SEED_F01_OK 3** (ver `fixtures/f01/SEED_RESULT.json`)

## Fora

- Textract / S3 Object Lock reais
- Job async SQS
