# PRISMA-EP-02 — User Stories Backend

> Escritor Back · Gerado em 2026-07-27 · Gate G5 aprovado

## Catálogo

| US-ID | Título | Feature | Endpoints | Arquivo |
|---|---|:---:|---:|---|
| `PRISMA-EP-02-F01-US-BE-01` | Cálculo e Persistência da Explicação | `F01` | 3 | [PRISMA-EP-02-F01-US-BE-01_Cálculo_e_Persistência_da_Explicação.md](./PRISMA-EP-02-F01-US-BE-01_Cálculo_e_Persistência_da_Explicação.md) |
| `PRISMA-EP-02-F02-US-BE-01` | Geração de Contrafactuais Viáveis | `F02` | 2 | [PRISMA-EP-02-F02-US-BE-01_Geração_de_Contrafactuais_Viáveis.md](./PRISMA-EP-02-F02-US-BE-01_Geração_de_Contrafactuais_Viáveis.md) |
| `PRISMA-EP-02-F03-US-BE-01` | Geração do Dossiê Regulatório | `F03` | 3 | [PRISMA-EP-02-F03-US-BE-01_Geração_do_Dossiê_Regulatório.md](./PRISMA-EP-02-F03-US-BE-01_Geração_do_Dossiê_Regulatório.md) |
| `PRISMA-EP-02-F04-US-BE-01` | Gravação Imutável da Trilha | `F04` | 3 | [PRISMA-EP-02-F04-US-BE-01_Gravação_Imutável_da_Trilha.md](./PRISMA-EP-02-F04-US-BE-01_Gravação_Imutável_da_Trilha.md) |
| `PRISMA-EP-02-F05-US-BE-01` | Resolução de Motivo a partir da Decisão | `F05` | 3 | [PRISMA-EP-02-F05-US-BE-01_Resolução_de_Motivo_a_partir_da_Decisão.md](./PRISMA-EP-02-F05-US-BE-01_Resolução_de_Motivo_a_partir_da_Decisão.md) |
| `PRISMA-EP-02-F06-US-BE-01` | Ciclo de Vida da Solicitação de Revisão | `F06` | 3 | [PRISMA-EP-02-F06-US-BE-01_Ciclo_de_Vida_da_Solicitação_de_Revisão.md](./PRISMA-EP-02-F06-US-BE-01_Ciclo_de_Vida_da_Solicitação_de_Revisão.md) |
| `PRISMA-EP-02-F07-US-BE-01` | Apuração Periódica de Equidade | `F07` | 3 | [PRISMA-EP-02-F07-US-BE-01_Apuração_Periódica_de_Equidade.md](./PRISMA-EP-02-F07-US-BE-01_Apuração_Periódica_de_Equidade.md) |
| `PRISMA-EP-02-F08-US-BE-01` | Ciclo de Vida da Requisição de Direito | `F08` | 3 | [PRISMA-EP-02-F08-US-BE-01_Ciclo_de_Vida_da_Requisição_de_Direito.md](./PRISMA-EP-02-F08-US-BE-01_Ciclo_de_Vida_da_Requisição_de_Direito.md) |
| `PRISMA-EP-02-F09-US-BE-01` | Execução Isolada de Simulação de Política | `F09` | 3 | [PRISMA-EP-02-F09-US-BE-01_Execução_Isolada_de_Simulação_de_Política.md](./PRISMA-EP-02-F09-US-BE-01_Execução_Isolada_de_Simulação_de_Política.md) |
| `PRISMA-EP-02-F10-US-BE-01` | Governança de Versões de Política | `F10` | 3 | [PRISMA-EP-02-F10-US-BE-01_Governança_de_Versões_de_Política.md](./PRISMA-EP-02-F10-US-BE-01_Governança_de_Versões_de_Política.md) |

**Total:** 10 US-BE · **29 endpoints documentados**

## Ordem sugerida de implementação

1. F10 — governança e versão de política
2. F04 — trilha WORM transversal
3. F05 — catálogo jurídico de motivos
4. F01 — explicação SHAP persistida
5. F02 — contrafactuais acionáveis
6. F03 — dossiê Art. 20
7. F08 — requisições Art. 18
8. F06 — revisão humana
9. F07 — fairness e alertas
10. F09 — simulação what-if

Ordem reduz risco: política versionada e auditoria sustentam snapshots; catálogo alimenta explicações; capacidades regulatórias consomem evidências persistidas; analytics e simulação entram após bases governadas.

## Cobertura transversal

- Contratos completos por endpoint, DTOs, exemplos e erros.
- DDL PostgreSQL específico para cada feature.
- RN001/RN002 canônicas, segurança OAuth2/OIDC, RBAC/ABAC e resiliência.
- Pelo menos seis testes por US e checklist Gate G5.

## Fontes

- `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02 - Índice.md`
- `02.Explorer/Output Cursor/Programa/PRISMA-EP-02/PRISMA-EP-02-F01 ... F10`
- `01.Visionario/Output Cursor/05_Epico_02_Motor_Decisao_Explicavel.md`
- Referência estrutural: `99.DownStream/Resumo do UpStream/User Stories/PRISMA-EP-06/`
