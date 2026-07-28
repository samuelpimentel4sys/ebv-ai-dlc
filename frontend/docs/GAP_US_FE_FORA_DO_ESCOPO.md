# Gap US-FE — o que ficou de fora (Sofia)

| Campo | Valor |
|-------|-------|
| **Agente** | Sofia · `dev-reactjs-esp` |
| **Data** | 2026-07-28 |
| **Método** | Downstream `PRISMA-EP-*` US-FE × showcase React × Explorer/Escritor Nexus × handoff Noah |

**Legenda:** ✅ no escopo entregue · 🟡 parcial · ❌ fora / backlog · ⏸ bloqueado BE

---

## 1. Foto rápida

| Fonte | Contagem | Situação Sofia |
|-------|----------|----------------|
| Showcase React (nav) | **56** telas | UI mock completa |
| US-FE Downstream md | **47** (EP-01…04 + EP-06) | EP-05 **sem** pasta md Downstream |
| Telas EP-05 no FE | **9** | Live plug ✅ · **docs US-FE ausentes** |
| Live × Noah BE | EP-01/02/04/05/06 | ✅ |
| EP-03 US-FE + telas | **9** | Mock · **F04 HITL** agora plugável (Noah `:8080`) · GenAI Emilly `:8090` |
| Nexus EP-05 antigo | 5 features · ~12 US-FE | **Reescrito** no Downstream |

Conclusão: o que Sofia “deve” implementar no ciclo atual = **Downstream PRISMA**. O que Nexus especificou e **não** entrou no Downstream = backlog de produto (precisa decisão Walter), não bug de plug.

---

## 2. Já coberto (Downstream → FE)

| Épico | US-FE Downstream | Telas FE | Live API |
|-------|-----------------:|---------:|----------|
| EP-01 Score | 10 | 10 | ✅ |
| EP-02 Explicável | 10 | 10 | ✅ |
| EP-03 Copiloto PJ | 9 | 9 | ⏸ mock (BE adiado) |
| EP-04 Sala de Risco | 9 | 9 | ✅ stub lab |
| EP-05 Contestação | **0 md** / 9 BE | 9 | ✅ |
| EP-06 Inclusão | 9 | 9 | ✅ |

---

## 3. Fora do Downstream — ainda especificado no UpStream/Nexus

### A. EP-05 Nexus (portal LGPD) ≠ EP-05 Prisma (contestação/console)

Explorer Nexus tinha **5 features**; Downstream Prisma fechou **9 features** de contestação/B2B e **marcou biometria como escopo distinto**.

| Nexus (Explorer) | Downstream Prisma | Implementar agora? |
|------------------|-------------------|--------------------|
| **F01** Biometria facial + Liveness (Rekognition) + MFA step-up | **Fora** (nota no índice BE EP-05) | ❌ só se Walter reabrir épico biometria |
| **F02** Direitos LGPD + XAI do score | Migrado em grande parte p/ **EP-02** | ✅ via EP-02 live |
| **F03** Abertura/gestão contestação | Virrou F01/F02/… contestação | ✅ |
| **F04** OCR/IA comprovantes (Textract/Bedrock) | **Não** virou US `PRISMA-EP-05` | ❌ backlog (anexos F08 = upload, sem OCR GenAI) |
| **F05** Painel SLA LGPD | Aproximado por F06 SLA | 🟡 SLA sim; SSE/tempo-real Nexus não |

**US-FE Nexus biometria (Escritor Front) — backlog explícito se reabrir:**

| US Nexus | Tela | Escopo |
|----------|------|--------|
| `EP05-F01-US-FE-01` | SCR-BIO-01 | Captura + guia facial + SDK Rekognition Liveness |
| `EP05-F01-US-FE-02` | SCR-MFA-01 | MFA step-up |
| `EP05-F01-US-FE-03` | SCR-BIO-02 | Feedback / score vivacidade / lockout |

Stack daquela US era **Angular** — se reabrir, reescrever em **React + Equifax DS** (não portar Angular).

### B. EP-03 Copiloto PJ (US-FE existem; GenAI Emilly · HITL Noah)

| Item | Estado |
|------|--------|
| 9 US-FE Downstream | ✅ escritas |
| 9 telas showcase | ✅ mock |
| **F04 HITL** Java Noah | ✅ lab (`0b537cd` · V50 · smoke OK) — **Sofia plugar** |
| GenAI Python Emilly | ✅ `:8090` — FE GenAI quando contrato liberar |
| Demais F01–F03/F05–F09 live | ⏸ GenAI Emilly (não Java) |

### C. Transversal (não é US de épico, mas produto)

| Item | Estado | Sprint Sofia |
|------|--------|--------------|
| Login OIDC PKCE (`prisma-steward-ui`) | ❌ | **P6** |
| Hardening contrato OpenAPI × mappers | 🟡 | **P1** |
| Empty/error reais (não só `?state=`) | 🟡 | **P1** |
| Neptune/Trino/SHAP reais | stub lab | Noah / infra — FE já consome stub |

---

## 4. Dívida documental (não bloqueia demo)

| Gap | Ação sugerida |
|-----|----------------|
| Pasta Downstream **sem** `00_INDICE_US-FE_PRISMA-EP-05.md` e sem 9 md US-FE | Escritor Front gerar a partir do nav FE + US-BE (rastreabilidade) |
| Copy FE menciona “biometria” em onboarding/timeline | Remover ou marcar “fora de escopo” p/ não confundir demo |
| Índices Downstream EP-05 FE | Alinhar IDs `PRISMA-EP-05-F0x-US-FE-01` com BE |

---

## 5. Backlog priorizado p/ implementar (decisão stakeholder)

| Prio | O quê | Depende de | Esforço FE (ordem mag.) |
|------|--------|------------|-------------------------|
| **P0** | Plug EP-03 **F04 HITL** live (`ApprovalPage` + submit) | Noah ✅ | 0.5–1 d |
| **P1** | Hardening live Score (gaps shape, erros reais) | Noah OpenAPI | 2–4 d |
| **P2** | EP-03 GenAI live (F01–F03, F05–F09) | Emilly `:8090` | 5–10 d pós-contrato |
| **P3** | OIDC login produto (P6) | Keycloak client UI | 3–5 d |
| **P4** | Biometria SCR-BIO-* (Nexus) | Decisão + BE liveness | 5+ d (G) |
| **P5** | OCR comprovantes GenAI (Nexus F04) | Textract/Bedrock | 5+ d |
| **P6** | Docs US-FE EP-05 Downstream | Escritor Front | 1–2 d |

---

## 6. Resposta direta

**Das US-FE Downstream Prisma:** showcase cobre as telas; live falta só **EP-03** (bloqueado BE).

**Das US-FE / features Nexus que “sumiram” no Downstream:** principalmente **biometria/liveness/MFA**, **OCR GenAI de comprovantes**, e refinamentos SLA em tempo real — **não** estão no escopo Noah+Sofia atual.

**Próximo passo sugerido:** Walter prioriza (A) P1 hardening, (B) reabrir EP-03, (C) reabrir biometria como épico/feature própria, ou (D) só fechar docs EP-05 FE.

_Sofia · gap US-FE · 2026-07-28_
