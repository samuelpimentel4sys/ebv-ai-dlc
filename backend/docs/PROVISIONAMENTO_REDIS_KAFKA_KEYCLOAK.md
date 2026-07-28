# Provisionamento — Redis · Kafka · Keycloak (Prisma Backend)

| Campo | Valor |
|-------|-------|
| **Para** | Time infra / você (provisionar) |
| **Consumidor** | Noah · `prisma-backend` (Java 21 / Spring Boot 3.4) |
| **Projeto Supabase** | Prisma Equifax · `jrpjrvttiqustpfedxdz` (já ok) |
| **Data** | 2026-07-28 |
| **Profile app** | `supabase` + vars abaixo no `.env` (não commitado) |

Entregar **URL/host + porta + credenciais** (ou secrets no vault). Preferir **TLS** em tudo que não for localhost.

---

## 1. Redis

### Para quê
- Cache de features / identity lookup (F02, F07)
- Budget/SLO decisão (F05, F08)
- Rate-limit console (EP-05)
- Session auxiliar (se OIDC stateful)

### Spec mínima

| Item | Valor |
|------|-------|
| Versão | **7.x** (Alpine ok) |
| Memória | ≥ **256 MB** (dev) · ≥ 1 GB (homolog) |
| Persistência | AOF opcional em homolog; RDB ok em dev |
| Eviction | `allkeys-lru` ou `volatile-lru` |
| Auth | **senha obrigatória** (`requirepass` / ACL) |
| TLS | Preferível (`rediss://`) |
| Rede | Acessível da máquina/CI que roda o backend |

### O que preciso de volta

```env
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
REDIS_SSL=true|false
# opcional
REDIS_USERNAME=default
REDIS_DB=0
```

URI aceita (alternativa):

```env
SPRING_DATA_REDIS_URL=rediss://:PASSWORD@HOST:6379/0
```

### Smoke esperado
```bash
redis-cli -h HOST -p 6379 -a '***' PING
# → PONG
```

### Não preciso (ainda)
- Redis Cluster / Sentinel (MVP single node)
- Redis Streams (Kafka cobre eventos)

---

## 2. Kafka (Apache Kafka / MSK / Confluent Cloud)

### Para quê
- **F01** publicação ordenada de eventos de crédito (`partition key = hash(documento)`)
- Correção pós-merge identidade (F07 undo → evento)
- Barramento EP-01 / EP-02 / EP-05 (mesmo bus, sem duplicar pipeline)

### Spec mínima

| Item | Valor |
|------|-------|
| Versão broker | **3.6+** (Bitnami 3.9 / MSK 3.x ok) |
| Partições (dev) | Topic principal **≥ 6** |
| Replication | 1 (dev) · ≥ 2 (homolog) |
| Auto-create topics | `true` em **dev** · `false` em homolog (criar via IaC) |
| Auth | SASL/SCRAM ou IAM (MSK) · plaintext **só** localhost |
| Schema Registry | **desejável** já (Avro F01) — se não tiver, aviso |

### Topics iniciais (criar já, se possível)

| Topic | Partições | Retention | Notas |
|-------|----------:|-----------|-------|
| `prisma.credit.events` | 6+ | ≥ 7 dias | Eventos crédito (F01) |
| `prisma.credit.events.dlq` | 3 | ≥ 14 dias | DLQ |
| `prisma.identity.corrections` | 3 | ≥ 7 dias | Undo/merge F07 |
| `prisma.score.recalc` | 6+ | ≥ 3 dias | F03 (próximo) |

Compactação: **não** no MVP (log append).

### Consumer group
- Prefixo: `prisma-backend`
- Group id default app: `prisma-backend`

### O que preciso de volta

```env
KAFKA_BOOTSTRAP=host1:9092,host2:9092
KAFKA_SECURITY_PROTOCOL=SASL_SSL   # ou PLAINTEXT | SSL | SASL_PLAINTEXT
KAFKA_SASL_MECHANISM=SCRAM-SHA-512 # se SASL
KAFKA_SASL_JAAS_CONFIG=org.apache.kafka.common.security.scram.ScramLoginModule required username="..." password="...";
# opcional Schema Registry
SCHEMA_REGISTRY_URL=https://...
SCHEMA_REGISTRY_USER=...
SCHEMA_REGISTRY_PASSWORD=...
```

### Smoke esperado
```bash
kafka-topics.sh --bootstrap-server $KAFKA_BOOTSTRAP --list
# deve listar prisma.credit.events (ou permitir create)
```

### Não preciso (ainda)
- MirrorMaker / multi-region
- Kafka Connect (Open Finance pode ser adapter HTTP primeiro)

---

## 3. Keycloak (OIDC)

### Para quê
- JWT nas APIs (`ROLE_DATA_STEWARD`, serviços score, producers)
- CT-08 F07 (403 sem role)
- EP-05 console B2B / credentials (depois)

### Spec mínima

| Item | Valor |
|------|-------|
| Versão | **24+** (Quarkus Keycloak) |
| Realm | `prisma` (nome sugerido) |
| Access Type | confidential clients + service accounts |
| Token | JWT RS256 · access token ≤ 15 min |
| HTTPS | obrigatório em homolog |

### Realm / clients a criar

**Realm:** `prisma`

| Client ID | Tipo | Uso |
|-----------|------|-----|
| `prisma-backend` | confidential · service account | Machine-to-machine (F01 producer, score) |
| `prisma-steward-ui` | public ou confidential | Data steward (merge identity) |
| `prisma-swagger` | public | Swagger Authorize (dev) |

**Roles (realm ou client `prisma-backend`):**

| Role | Quem usa |
|------|----------|
| `ROLE_DATA_STEWARD` | Merge / candidates F07 |
| `ROLE_EVENT_PRODUCER` | POST eventos F01 |
| `ROLE_PLATFORM` | Admin/ops |
| `ROLE_SCORE_SERVICE` | Decisão / score interno |
| `ROLE_SRE` | Observabilidade |

Mapper: incluir roles no claim `realm_access.roles` **ou** `resource_access.prisma-backend.roles` (avisar qual).

### Usuários smoke (dev)

| User | Roles |
|------|-------|
| `steward.dev` | `ROLE_DATA_STEWARD` |
| `producer.dev` | `ROLE_EVENT_PRODUCER` |
| `sre.dev` | `ROLE_SRE` |

Senhas: gerar e mandar via canal seguro (1Password / vault).

### O que preciso de volta

```env
OIDC_ISSUER_URI=https://KEYCLOAK_HOST/realms/prisma
OIDC_JWK_SET_URI=https://KEYCLOAK_HOST/realms/prisma/protocol/openid-connect/certs
# client backend (service account)
OIDC_CLIENT_ID=prisma-backend
OIDC_CLIENT_SECRET=...
# opcional audience
OIDC_AUDIENCE=prisma-backend
```

Spring Boot vai usar:
```yaml
spring.security.oauth2.resourceserver.jwt.issuer-uri: ${OIDC_ISSUER_URI}
```

### Smoke esperado
```bash
# password grant ou client_credentials
curl -s -X POST "$OIDC_ISSUER_URI/protocol/openid-connect/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=prisma-backend" \
  -d "client_secret=***"
# → access_token JWT com roles
```

### Não preciso (ainda)
- Federação AD/LDAP
- Fine-grained Authorization Services Keycloak
- MFA (homolog pode esperar)

---

## 4. Checklist de entrega (copie e marque)

```text
[ ] Redis HOST/PORT/PASSWORD (+ SSL flag)
[ ] Kafka BOOTSTRAP + security (SASL/TLS se houver)
[ ] Topics: prisma.credit.events (+ dlq + identity.corrections)
[ ] Schema Registry URL (se existir)
[ ] Keycloak base URL
[ ] Realm prisma criado
[ ] Clients: prisma-backend (+ secret), prisma-swagger
[ ] Roles: DATA_STEWARD, EVENT_PRODUCER, PLATFORM, SCORE_SERVICE, SRE
[ ] Users smoke + senhas no vault
[ ] Rede: liberar IP da máquina de dev / CI
[ ] Documentar claim de roles (realm_access vs resource_access)
```

---

## 5. Ambientes sugeridos

| Env | Redis | Kafka | Keycloak |
|-----|-------|-------|----------|
| **dev** | single, auth | single/MSK small, auto-create ok | realm `prisma` |
| **homolog** | single+TLS | MSK multi-AZ | HTTPS + clients separados |
| **prod** | depois | depois | depois |

---

## 6. Enquanto isso (Noah)

Continuo desenvolvimento **com adapters desligáveis** (`spring.autoconfigure.exclude` / profiles):

- Código F01 (ports + API) sem broker real → liga quando `KAFKA_BOOTSTRAP` existir
- Security resource-server stub → ativa com `OIDC_ISSUER_URI`
- Redis template opcional → ativa com `REDIS_HOST`

Quando provisionar, basta preencher `.env` e subir:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=supabase,infra
```

Profile `infra` (a criar) habilita Kafka + Redis + OIDC juntos.

---

## 7. Contato / formato de resposta

Pode responder neste chat ou colar um bloco:

```env
# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
REDIS_SSL=

# Kafka
KAFKA_BOOTSTRAP=
KAFKA_SECURITY_PROTOCOL=
KAFKA_SASL_MECHANISM=
KAFKA_SASL_JAAS_CONFIG=

# Keycloak
OIDC_ISSUER_URI=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_ROLES_CLAIM=realm_access.roles
```

_Noah · Prisma Backend · não versionar secrets_
