# HANDOFF — Kernel Java (Noah G7) → Argos Self-Healing

**Data:** 2026-08-18  
**Tentativa:** FIX 1/3  
**Repo:** `C:\Users\WalterAraujodeMoura\Documents\AI-DLC\Prisma`  
**Commit:** NÃO feito (Kernel só código)

---

## Status FIX-ID

| FIX-ID | Status | Notas |
|--------|--------|-------|
| FIX-01 Fail-closed auth | **done** | `openLocal` + `permitAll` genérico removidos; 1 chain deny-by-default; OIDC mandatory fora de `local` |
| FIX-02 KBA real | **done** | birthDate+lastDigits obrigatórios; records via `X-Session-Token` |
| FIX-03 Actor = JWT sub | **done** | `LabActorResolver.resolve(null, authentication)`; `DEFAULT_ACTOR` removido |
| FIX-04 Python OIDC | **done (Emilly)** | oidc default True + audience; lab só ENVIRONMENT=local |
| FIX-05 MinIO secrets | **done** | `:?` env + bind 127.0.0.1; literais removidos de compose/doc |
| FIX-06 Path confinement | **done** | normalize + `startsWith(root)`; unit test OK |
| FIX-07 localhost + Redis AUTH | **done** | compose Java: 127.0.0.1 + requirepass |
| FIX-08 Dockerfile non-root | **done** | USER app + HEALTHCHECK alpine |
| FIX-09 Spring Boot ≥ 3.4.5 | **done** | parent **3.4.13**; testes alvo verdes |
| FIX-10 gitleaks + dockerignore | **done** | pre-commit + `.dockerignore` + step CI |
| FIX-11 Vite | **done (Sofia)** | pin `6.4.3` + lock; identify envia birthDate+lastDigits |
| FIX-12 matcher extract | **skipped** | P2 opcional — não trivial |

---

## Acceptance greps (executados)

| Check | Resultado |
|-------|-----------|
| `anyRequest().permitAll` em SecurityConfig | **0 hits** |
| `self-service/**` + `permitAll` | **0** (matcher self-service removido; cai em `authenticated`) |
| `permitAll` restantes | só `OPTIONS /**` e `/actuator/health/**` |
| `prismaPrisma1` em tree tracked/backend (grep ferramenta) | **0** |
| `DEFAULT_ACTOR` IdentityController | **0** |
| `lab accepts any non-null` | **0** |
| `OIDC_ENABLED:true` default YAML | **sim** (application.yml + infra) |
| `actor-fallback` default false | **sim** |
| `management.endpoints…include: health` | **sim** |
| Spring parent | **3.4.13** |
| compose `127.0.0.1:` postgres/redis/kafka/minio | **sim** |

---

## Testes executados (não inventar)

```
mvn -B -Dtest=SelfServiceServiceTest,LocalDisputeEvidenceStoreAdapterTest,OidcSecurityWebMvcTest,LabActorResolverTest,KeycloakRealmRoleConverterTest test
→ Tests run: 17, Failures: 0, Errors: 0 — BUILD SUCCESS
```

**NÃO rodado nesta tentativa:** suite Maven completa; `docker compose config`; imagem Docker `id≠0`; gitleaks CLI full-repo; curl live 401 contra app subida; Keycloak JWKS real.

---

## Ressalvas DEV / infra para Argos (pegadinhas)

Marcar **N/A-DEV / mitigated-in-code / requires-infra** — **não** tratar como “fixed in prod infra”:

| Item | Marcação | Por quê |
|------|----------|---------|
| Keycloak real / JWKS prod | requires-infra | Lab sem realm; CT usa MockMvc + JwtDecoder mock |
| WAF / network policies cluster | requires-infra | Compose só mitiga bind `127.0.0.1` no laptop |
| Kafka SASL/SCRAM | requires-infra | Compose ainda PLAINTEXT lab |
| S3 Object Lock WORM COMPLIANCE | requires-infra / mitigated-in-code | Path jail FS local; MinIO Object Lock = op manual + bucket |
| ClamAV AV scan pipeline | requires-infra | Serviço no compose.obs; não integrado no fluxo Java FIX |
| Image digests pin (sha256) | requires-infra / N/A-DEV | Tags versionadas; digest pin = Catalisador/IaC |
| Actions pin SHA (checkout/setup-java) | partial / N/A-DEV | gitleaks-action@v2 adicionado; pins SHA completos não feitos |
| OIDC audience / mTLS | requires-infra | Fora deste pacote Java |
| Network `0.0.0.0` mitigation | mitigated-in-code (lab) | Só compose localhost bind — **não** substitui NetworkPolicy K8s |
| Senha MinIO/Redis em `.env` local | N/A-DEV | `.env` local pode ainda ter segredo antigo — **rodar rotação**; não versionar |
| Prometheus/swagger fechados | mitigated-in-code | Exposure só `health`; swagger exige auth |

---

## Regressões (FE / lab)

1. **FE lab:** `OIDC_ENABLED=false` **só** em `.env` local + profile `local`. YAML default agora `true`. Sem Keycloak, APIs retornam 401 (fail-closed) — health aberto.
2. **Self-service:** body **deve** enviar `birthDate` + `lastDigits` (4 dígitos = sufixo doc). `GET /records` usa header `X-Session-Token` (não query).
3. **Identity merge/undo:** `actorId` no body **ignorado**; actor = JWT `sub` (lab fallback só se `PRISMA_LAB_ACTOR_FALLBACK=true`).
4. **Compose:** exige `REDIS_PASSWORD` e `MINIO_ROOT_PASSWORD` no `.env` ou start falha (`:?`).

---

## Arquivos alterados

- `backend/src/main/java/.../SecurityConfig.java`
- `backend/src/main/java/.../OidcMandatoryOnStagingProd.java`
- `backend/src/main/java/.../IdentifySelfServiceService.java`
- `backend/src/main/java/.../SelfServiceController.java`
- `backend/src/main/java/.../IdentityController.java`
- `backend/src/main/java/.../LocalDisputeEvidenceStoreAdapter.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-infra.yml`
- `backend/src/test/java/.../SelfServiceServiceTest.java`
- `backend/src/test/java/.../OidcSecurityWebMvcTest.java`
- `backend/src/test/java/.../LocalDisputeEvidenceStoreAdapterTest.java` *(novo)*
- `backend/docker-compose.yml`
- `backend/docker-compose.obs.yml`
- `backend/Dockerfile`
- `backend/pom.xml`
- `backend/.dockerignore` *(novo)*
- `backend/.env.example`
- `backend/docs/INSTRUCAO_DOCKER_SERVICOS_OBS.md`
- `.pre-commit-config.yaml` *(novo)*
- `.github/workflows/backend-ci.yml`
- `docs/HANDOFF_KERNEL_ARGOS_SELFHEALING_2026-08-18.md` *(este)*

---

---

## Kernel Python (Emilly)

| Item | Status |
|------|--------|
| FIX-04 OIDC default + audience + 503 fora local | **done** |
| FIX-07 compose Python 127.0.0.1 + Redis AUTH | **done** |
| pytest `test_jwt_auth` + `test_showcase` | **19 passed** |

Ressalvas: JWKS/Keycloak real = N/A-DEV; staging+OIDC off → **503** (não 401); lab = `ENVIRONMENT=local` + `OIDC_ENABLED=false`.

---

## Kernel React (Sofia)

| Item | Status |
|------|--------|
| FIX-11 Vite 6.4.3 | **done** (`package.json` + lock) |
| FE identify birthDate+lastDigits | **done** (`frontend/src/api/dispute.ts`) |
| npm test / build | **208 OK** / build OK |

Lab: OIDC fail-closed no BE → `.env` local `OIDC_ENABLED=false` **ou** PKCE real.

---

## Próximo (Argos)

Revalidar checklist FIX: SS-01, IAC-01..04, SR/ST P0, SQ security ≠ E.  
**Pegadinha:** itens `requires-infra` / `N/A-DEV` na tabela acima **não** são falha de Kernel — marcar ressalva com 4 itens, não reabrir P0 de código já mitigado.
