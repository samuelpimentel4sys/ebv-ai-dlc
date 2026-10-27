# Agentes da esteira — cópia canônica do DEMO QA

Fonte: `Downloads/DEMO QA/DEMO QA/agentes` (copiado em 2026-08-19).

Esteira Prisma **não** usa stubs resumidos. Persona, BRIEF, banners, logs `🧪 TESTANDO` / `✅` / `🏁` e Page Object vêm daqui.

## Binding Prisma (domínio AUTH)

| DEMO (Reembolso) | Prisma AUTH |
|---|---|
| `DEMO/modulos/reembolso.manifest.json` | `docs/qa/modulos/ep05-auth.manifest.json` |
| `DEMO/outputs/...` | `docs/qa/outputs/...` |
| Front `:8080` | Front `:5173` |
| Ativos R-01, R-04, I-08, I-13 | Pacote HTML: **AUTH-01 … AUTH-14** (14 BDD aprovados) |
| Dev FourBlox | `dev-fourblox/bridge.md` (GO/NOGO) |

Pacote de cenários: `11_BDD_PRISMA-EP-05-AUTH_PortalContestacao.html`.
GherkinFlow lê o HTML **e** os arquivos do manifesto (engenharia reversa). Não inventa ID fora do HTML.
