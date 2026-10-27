---
name: self-healing
description: "Self-healing Prisma com gate GO/NOGO. Acionar após falha Playwright."
---

Você coordena o **self-healing** da esteira QA Prisma: human-in-the-loop, trilha de auditoria, sem correção silenciosa.

Método extraído do pacote DEMO QA (Reembolso) e da esteira genérica L1/L2 do Solution Center.

## Duas camadas

| Camada | O quê cura | Quem |
|--------|------------|------|
| **L1 — Test Healing** | Locator, wait, flake | Playwright Agent (ajuste de spec) |
| **L2 — App Healing** | Bug real no produto | Dev Kernel (Sofia/Noah/Emilly) |

Regra de ouro: **teste não mascara bug de app**.

## Ativação visível (OBRIGATÓRIO)

1. **Playwright (detecção):** Read `docs/qa/agentes/playwright/playwright.md` → banner 🔴 PLAYWRIGHT SELF-HEALING
2. **Gate GO/NOGO** (antes do Dev)
3. **Dev Kernel (só com GO):** Read `docs/qa/agentes/dev-kernel/bridge.md`

## Quando acionar

- Playwright retornou `failed` na Etapa 3
- Existe `docs/qa/setup/.qa-falha-pendente.json`
- Banner `🔴 SELF-HEALING — FALHA DETECTADA`

## Protocolo (ordem)

1. Ler falha:
   ```bash
   node docs/qa/scripts/qa-self-healing.cjs pending
   ```
2. Banner no chat:
   ```
   🔴 SELF-HEALING — Falha em {cenarioId}
      Erro: {erro}
      Esperado: {urlEsperada ou comportamento BDD}
      Arquivos sugeridos: {lista}
      Evidências: {screenshot / vídeo / HTML}
   ```
3. Gate GO/NOGO via `AskQuestion`:
   - `GO — ativar self-healing (Recomendado)`
   - `NOGO — manter falha e encerrar`
   - **NOGO:** não ativar Dev, não editar código
4. Se GO: ativar Dev Kernel — corrige **código da app**
5. Registrar:
   ```bash
   node docs/qa/scripts/qa-self-healing.cjs resolve '{"resumoCorrecao":"...","arquivosAlterados":["..."]}'
   ```
6. Reexecutar **só** o cenário falho (headed)
7. Banner de sucesso ou escalada após `maxTentativas` (2)

## Princípios

| ✅ Fazer | ❌ Não fazer |
|----------|-------------|
| Audit log em `self-healing-audit.jsonl` | Fix automático no teste |
| Pedir GO/NOGO antes do Dev | Ativar Dev sem confirmação |
| Intent-based (BDD = verdade) | Injetar bug pela esteira |
| Re-run focalizado | Silent healing |

## Referências

- `docs/qa/agentes/self-healing/protocolo.md`
- `docs/qa/agentes/dev-kernel/bridge.md`
- Manifesto do módulo → chave `selfHealing`
