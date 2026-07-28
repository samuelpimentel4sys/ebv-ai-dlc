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
| Showcase React (nav) | **59** telas | UI mock + BIO lab |
| US-FE Downstream md | **47** (EP-01…04 + EP-06) | EP-05 **sem** pasta md Downstream |
| Telas EP-05 no FE | **12** | Contestação 9 + BIO 3 · live plug ✅ |
| Live × Noah BE | EP-01/02/04/05/06 | ✅ (+ Liveness V51) |
| EP-03 US-FE + telas | **9** | Mock · **F04 HITL** ✅ live · GenAI Emilly `:8090` |
| Nexus EP-05 antigo | 5 features · ~12 US-FE | Contestação Downstream + BIO reaberto lab |

Conclusão: o que Sofia “deve” implementar no ciclo atual = **Downstream PRISMA**. O que Nexus especificou e **não** entrou no Downstream = backlog de produto (precisa decisão Walter), não bug de plug.

---

## 2. Já coberto (Downstream → FE)

| Épico | US-FE Downstream | Telas FE | Live API |
|-------|-----------------:|---------:|----------|
| EP-01 Score | 10 | 10 | ✅ |
| EP-02 Explicável | 10 | 10 | ✅ |
| EP-03 Copiloto PJ | 9 | 9 | ⏸ mock (BE adiado) |
| EP-04 Sala de Risco | 9 | 9 | ✅ stub lab |
| EP-05 Contestação + BIO | **0 md** / 9 BE + Liveness | 12 | ✅ (+ BIO lab) |
| EP-06 Inclusão | 9 | 9 | ✅ |

---

## 3. Fora do Downstream — ainda especificado no UpStream/Nexus

### A. EP-05 Nexus (portal LGPD) ≠ EP-05 Prisma (contestação/console)

Explorer Nexus tinha **5 features**; Downstream Prisma fechou **9 features** de contestação/B2B e **marcou biometria como escopo distinto**.

| Nexus (Explorer) | Downstream Prisma | Implementar agora? |
|------------------|-------------------|--------------------|
| **F01** Biometria facial + Liveness (Rekognition) + MFA step-up | Lab Noah V51 · FE SCR-BIO | ✅ lab (stub/WireMock · sem Amplify AWS) |
| **F02** Direitos LGPD + XAI do score | Migrado em grande parte p/ **EP-02** | ✅ via EP-02 live |
| **F03** Abertura/gestão contestação | Virrou F01/F02/… contestação | ✅ |
| **F04** OCR/IA comprovantes (Textract/Bedrock) | **Não** virou US `PRISMA-EP-05` | ❌ backlog (anexos F08 = upload, sem OCR GenAI) |
| **F05** Painel SLA LGPD | Aproximado por F06 SLA | 🟡 SLA sim; SSE/tempo-real Nexus não |

**US-FE Nexus biometria — plug FE lab (React + Equifax DS):**

| US Nexus | Tela | Estado Sofia |
|----------|------|--------------|
| `EP05-F01-US-FE-01` | SCR-BIO-01 | ✅ `/titular/biometria` · consent + session + guia |
| `EP05-F01-US-FE-02` | SCR-MFA-01 | ✅ `/titular/biometria/mfa` · OTP lab |
| `EP05-F01-US-FE-03` | SCR-BIO-02 | ✅ `/titular/biometria/resultado` |

API: `frontend/src/api/liveness.ts` → Noah `POST /api/v1/auth/biometric-consent` + `…/liveness/session`.  
**Ainda fora:** Amplify FaceLivenessDetector · GetFaceLivenessSessionResults · JWT IAL3.

### B. EP-03 Copiloto PJ (US-FE existem; GenAI Emilly · HITL Noah)

| Item | Estado |
|------|--------|
| 9 US-FE Downstream | ✅ escritas |
| 9 telas showcase | ✅ mock |
| **F04 HITL** Java Noah | ✅ lab + FE (`pjHitl.ts`) |
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
| Copy FE menciona “biometria” em onboarding/timeline | Alinhar copy ao fluxo SCR-BIO (já no nav) |
| Índices Downstream EP-05 FE | Alinhar IDs `PRISMA-EP-05-F0x-US-FE-01` com BE |

---

## 5. Backlog priorizado p/ implementar (decisão stakeholder)

| Prio | O quê | Depende de | Esforço FE (ordem mag.) |
|------|--------|------------|-------------------------|
| **P0** | Plug EP-03 **F04 HITL** live | Noah ✅ · Sofia ✅ `de5d422` | feito |
| **P1** | Hardening live Score (gaps shape, erros reais) | Noah OpenAPI | 2–4 d |
| **P2** | EP-03 GenAI live (F01–F03, F05–F09) | Emilly `:8090` | 5–10 d pós-contrato |
| **P3** | OIDC login produto (P6) | Keycloak client UI | 3–5 d |
| **P4** | Biometria SCR-BIO-* lab (Noah V51) | ✅ FE `liveness.ts` + 3 telas | feito (Amplify/GetResults backlog) |
| **P5** | OCR comprovantes GenAI (Nexus F04) | Textract/Bedrock | 5+ d |
| **P6** | Docs US-FE EP-05 Downstream | Escritor Front | 1–2 d |

---

## 6. Resposta direta

**Das US-FE Downstream Prisma:** showcase cobre as telas; live falta sobretudo **EP-03 GenAI** (Emilly).

**Das US-FE Nexus “reabertas”:** **biometria/liveness/MFA** pluggada no lab (stub/WireMock) — Amplify AWS + GetResults ainda backlog. **OCR GenAI** e SLA SSE continuam fora.

**Próximo passo sugerido:** (A) P1 hardening Score, (B) GenAI Emilly, (C) Amplify quando `LIVENESS_MODE=aws`, (D) docs US-FE EP-05 Downstream.

_Sofia · gap US-FE · 2026-07-28_
