# Dev Agent Record — P1 Fundação dados (Supabase + RAG)

**Agente:** Emilly · **Data:** 2026-07-28  
**Sprint:** P1 (parcial — schema + F07/F02 API)

## Entregue

- Migration Supabase `ep03_pj_genai_vector_tables` (projeto **Prisma Equifax** `jrpjrvttiqustpfedxdz`)
- Extensão `vector` + tabelas F01/F07/F02:
  - `tb_pj_document`, `tb_pj_extraction`, `tb_pj_extraction_field`
  - `tb_pj_library_document`, `tb_pj_library_acl`
  - `tb_pj_rag_chunk` (vector 1536 + HNSW), `tb_pj_rag_answer`, `tb_pj_rag_citation`
- Alembic espelho: `alembic/versions/001_ep03_pj_genai_vector_tables.py`
- Repos SQLAlchemy async + use cases index/query/library
- Endpoints:
  - `POST /api/v1/pj/rag/index`
  - `POST /api/v1/pj/rag/query`
  - `GET /api/v1/pj/rag/citations/{answerId}`
  - `POST /api/v1/pj/library/documents`
  - `GET /api/v1/pj/library/{cnpj}`
  - `DELETE /api/v1/pj/library/documents/{docId}`
- Pad 768→1536 para nomic local (mesmo `index_version`)

## Trade-offs

- Coluna canônica **1536** (US F02); local nomic 768 faz zero-pad + L2-normalize
- Índice **HNSW** (melhor que IVFFlat vazio no Supabase)
- F01 OCR/extração LLM ainda não implementada (só schema)
- AuthZ JWT/ACL carteira ainda stub (lab)

## Dívida

- Integração e2e real Ollama embed → Supabase
- F01 extract use case
- RN003 ownership ACL
- Reindex path quando trocar provider/dims (RN004)

## Próximo

F01 extração estruturada + smoke index/query contra Ollama + Supabase
