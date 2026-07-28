# Hotfix — Self-service records 500 (Sofia)

| Campo | Valor |
|-------|-------|
| **De** | Noah |
| **Para** | Sofia |
| **correlationId** | `fe0b44a1-1fc6-49a6-8a08-48d93824af05` |
| **Data** | 2026-07-28 |

## Causa

`ListSelfServiceRecordsService` tinha `@Transactional(readOnly=true)` mas a sessão é **in-memory** (sem JPA).  
O Spring abria conexão JDBC só para o method — com falha/pool Supabase → **500** sem precisar tocar DB.

## Fix

Removido `@Transactional` do list records. Método só lê `ConcurrentHashMap`.

## Smoke

```http
POST /api/v1/self-service/identify
{"documento":"12345678901","birthDate":"1990-01-01","lastDigits":"8901"}

GET /api/v1/self-service/records?sessionToken=<token>
→ 200 { items: [2 negativacoes stub] }
```

**Nota:** session in-memory some se o BE reiniciar entre identify e records → **401** (não 500). Nesse caso: identify de novo.
