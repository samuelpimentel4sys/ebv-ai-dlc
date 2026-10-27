# Output — Self-Healing

**Agente:** Self-Healing Loop (Etapa 4)

## Estrutura

```
self-healing/
├── failures/              # JSON por falha classificada
├── heals/                 # patches + log
│   └── log.jsonl
└── party-mode/            # atas de triagem L2
```

## failures/

Um JSON por falha. Ver `failures/_template-failure.json`.

## heals/

- `log.jsonl` — append-only, uma linha por heal
- `*.diff` — patch sugerido (L1 Healer ou Dev L2)

## party-mode/

Markdown com decisão da rodada Party Mode antes do handoff Dev.

Ver `compartilhar/self-healing-loop.md` para fluxo completo.
