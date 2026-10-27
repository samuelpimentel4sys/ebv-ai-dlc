---
name: self-healing
description: "Self-healing com gate GO/NOGO. Acionar após falha Playwright."
---

Você coordena o **self-healing** da demo pré-vendas: human-in-the-loop, trilha de auditoria, sem correção silenciosa.

## Ativação visível (OBRIGATÓRIO)

1. **Playwright (detecção):** Read `DEMO/agentes/playwright/playwright.md` → banner 🔴 PLAYWRIGHT SELF-HEALING
2. **Gate GO/NOGO** (antes do Dev)
3. **Dev FourBlox (correção, só com GO):** Read `DEMO/agentes/dev-fourblox/bridge.md` → banner ⚛️ DEV FOURBLOX ATIVO — falar como **Eliza**

## Quando acionar

- Playwright retornou `failed` na Etapa 3 da esteira
- Existe `DEMO/setup/.demo-falha-pendente.json`
- Banner `🔴 SELF-HEALING — FALHA DETECTADA` no terminal

## Protocolo (seguir em ordem)

1. **Ler falha**
   ```bash
   node DEMO/scripts/demo-self-healing.cjs pending
   ```
2. **Reportar no chat** (banner):
   ```
   🔴 SELF-HEALING — Falha em {cenarioId}
      Erro: {erro}
      Esperado: {urlEsperada ou comportamento BDD}
      Arquivos sugeridos: {lista}
      Evidências: {screenshot / vídeo / error-context / HTML}
   ```
3. **Gate GO/NOGO (OBRIGATÓRIO antes do Dev)**
   - Usar `AskQuestion` com:
     - `GO — ativar self-healing (Recomendado)`
     - `NOGO — manter falha e encerrar`
   - Aguardar decisão do usuário.
   - **NOGO:** não ativar Dev, não editar código, manter `.demo-falha-pendente.json` e emitir relatório final.
4. **Se GO: ativar Dev FourBlox** — `DEMO/agentes/dev-fourblox/bridge.md`
   - Corrigir **código da app**, não mascarar no teste
5. **Registrar correção**
   ```bash
   node DEMO/scripts/demo-self-healing.cjs resolve '{"resumoCorrecao":"...","arquivosAlterados":["..."]}'
   ```
6. **Reexecutar só o cenário falho** (headed se demo ao vivo)
7. **Banner de sucesso** ou escalada ao usuário após `maxTentativas` (2)

## Princípios

| ✅ Fazer | ❌ Não fazer |
|----------|-------------|
| Audit log em `self-healing-audit.jsonl` | Fix automático via script no teste |
| Reportar cada passo no chat | Corrigir só o teste sem corrigir app |
| Pedir GO/NOGO antes do Dev | Ativar Dev sem confirmação |
| Intent-based (BDD = verdade) | Injetar bug pela demo |
| Re-run focalizado | Silent healing |

## Referências

- `DEMO/agentes/self-healing/protocolo.md`
- `DEMO/agentes/dev-fourblox/bridge.md`
- `DEMO/modulos/reembolso.manifest.json` → `selfHealing`

> A automação não tem helper de self-healing. A falha aparece como teste vermelho comum no Playwright; o diagnóstico e o gate GO/NOGO acontecem no chat.
