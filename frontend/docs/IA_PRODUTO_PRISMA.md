# IA de produto — Prisma Equifax

**Atualizado:** 2026-07-28 · Sofia  
**Objetivo:** o operador vê **módulos de produto**, não épicos BMAD.

Épico/Feature/US-ID permanecem no código, testes e `?dev=1`.

## Módulos

| Módulo UI | Conteúdo | Origem BMAD |
|-----------|----------|-------------|
| Plataforma | Saúde barramento, SLO, replay | EP-01 F01 F08 F10 |
| Dados | Conectores, identidade, features | EP-01 F06 F07 F02 |
| Risco & Score | Timeline score | EP-01 F03 |
| Integração | Playground decisões | EP-01 F05 |
| Modelos | Registry promote/rollback | EP-01 F09 |
| Compliance | Snapshots + explicabilidade | EP-01 F04 + EP-02 |
| Crédito PJ | Copiloto GenAI | EP-03 |
| Portfólio | Sala de risco | EP-04 |
| Contestações | Fila / SLA / B2B | EP-05 |
| Inclusão | Thin-file / coach | EP-06 |

## Flags de UI

| Query / storage | Efeito |
|-----------------|--------|
| (default) | Modo **produto** |
| `?demo=1` ou `localStorage prisma.ui.mode=demo` | Trilhas, JourneyNav, WelcomeTour, roteiro |
| `?dev=1` | Exibe US-ID no header |

## Rotas estáveis

Paths das US-FE **não mudam**. Só agrupamento e copy.

Código: `src/app/modules.ts` · `src/lib/productMode.ts`
