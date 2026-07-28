# EBV Prisma — Frontend

Aplicação de demonstração do programa **Prisma (Equifax | BoaVista)** com **59 telas de produto** implementadas a partir das User Stories de frontend (US-FE) dos seis épicos.

> **Downstream:** workspace em `AI-DLC/Prisma/frontend` · integração com `Prisma/backend` (Noah).  
> Plano: [`docs/PLANO_TRABALHO_FRONTEND.md`](./docs/PLANO_TRABALHO_FRONTEND.md) · Mapa FE↔BE: [`docs/MAPA_FE_VS_BE.md`](./docs/MAPA_FE_VS_BE.md)  
> Origem: [PrismaShowcase](https://github.com/SolutionCenter4Sys/PrismaShowcase)

O design é regido pelo **Equifax Design System v1.0** — tokens, componentes, acessibilidade e budgets de performance. Referências a tokens Foursys nas US-FE foram descartadas; a marca Foursys aparece apenas como assinatura.

## Stack

| Camada | Escolha |
|---|---|
| Build | Vite 6 |
| UI | React 18 + TypeScript strict |
| Rotas | React Router 7 (rotas reais das US-FE, chunks sob demanda) |
| Estilo | Tailwind 3 mapeado 1:1 nos tokens `--color-*`, `--space-*`, `--radius-*` do DS |
| Motion | Framer Motion |
| Ícones | lucide-react |
| Gráficos | SVG próprio com equivalente textual acessível |
| Testes | Vitest + Testing Library + axe-core |

Sem backend: cada épico tem `data.ts` com DTOs da seção 8.1 da US-FE e mocks servidos por `useMockQuery` (`idle / loading / success / empty / error`).

Qualquer rota aceita `?state=error` ou `?state=empty` para demonstrar o tratamento de falha de serviço e de resposta vazia sem alterar o mock da tela.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | `tsc --noEmit` + build de produção em `dist/` |
| `npm run preview` | serve o build |
| `npm test` | suíte Vitest (DS, telas, interações, shell, acessibilidade) |
| `npm run budget` | valida budgets do DS contra `dist/` (após o build) |

## Estrutura

```
src/
  styles/eqx-tokens.css   tokens tier 1/2/3 do DS + tema escuro + densidade
  ds/                     primitivas e charts/
  shell/                  AppShell, Sidebar, TopBar, SearchOverlay, ScreenLayout, JourneyNav, WelcomeTour
  app/                    home, landing de épico, trilhas, tema/densidade, rotas, navegação
  epics/<epico>/          data.ts (DTOs + mocks), telas e nav.tsx
  test/                   ds, screens, interactions, shell, journeys, a11y
scripts/
  check-budget.mjs        verificação dos budgets de performance
```

Cada tela registra-se em `src/epics/<epico>/nav.tsx` com rota da US-FE, `usId`, descrição e keywords. `src/epics/registry.ts` agrega os seis épicos; `src/app/navigation.ts` compõe home + produto.

## Trilhas por persona

`src/app/journeys.ts` organiza as 59 telas em **15 trilhas**, cada uma com persona, objetivo e sequência de passos. Uma tela pertence a exatamente uma trilha — garantido por teste.

A navegação toda deriva dessas trilhas:

- home (`/`) lista os épicos com suas trilhas e personas;
- `/epicos/:epicId` abre a landing do épico com o roteiro de cada trilha;
- a sidebar agrupa por épico e, dentro dele, por trilha numerada;
- o rodapé de cada tela e as setas do topo movem para o passo anterior/próximo da trilha, não para a tela vizinha no registro.

| Épico | Domínio | Trilhas | Telas |
|---|---|---|---|
| EP-01 | Score Vivo | 2 | 10 |
| EP-02 | Explicabilidade & Compliance | 3 | 10 |
| EP-03 | Copiloto de Crédito PJ | 2 | 9 |
| EP-04 | Sala de Risco | 3 | 9 |
| EP-05 | Contestação Digital & Console B2B | 3 | 9 |
| EP-06 | Thin-file & Coach Financeiro | 2 | 9 |

## Acessibilidade e performance

- Auditoria axe-core na home, nas 6 landings de épico, nas 59 telas de produto e no shell.
- Alvo de toque 48 px, `aria-live` em toasts, foco visível do DS, skip-link.
- Busca: `Ctrl+K` ou `/` (combobox + listbox).
- Tour de primeira visita na home (trilhas, busca, tema), dispensa registrada em `localStorage`.
- Budgets: CSS < 50 KB, JS inicial gzip < 150 KB, chunks sob demanda.
