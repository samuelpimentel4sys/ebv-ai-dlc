"""EP-03 PJ GenAI tables — mirror Supabase migration ep03_pj_genai_vector_tables.

Revision ID: 001_ep03_pj
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "001_ep03_pj"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions")
    op.execute(
        """
CREATE TABLE IF NOT EXISTS public.tb_pj_document (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_uri TEXT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  status VARCHAR(30) NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pj_doc_cnpj ON public.tb_pj_document (cnpj);

CREATE TABLE IF NOT EXISTS public.tb_pj_extraction (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.tb_pj_document(id) ON DELETE CASCADE,
  engine VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  threshold NUMERIC(5,4) NOT NULL,
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pj_extraction_doc ON public.tb_pj_extraction (document_id);

CREATE TABLE IF NOT EXISTS public.tb_pj_extraction_field (
  id UUID PRIMARY KEY,
  extraction_id UUID NOT NULL REFERENCES public.tb_pj_extraction(id) ON DELETE CASCADE,
  field_key VARCHAR(80) NOT NULL,
  value_num NUMERIC(18,4),
  value_text TEXT,
  confidence NUMERIC(5,4) NOT NULL,
  review_status VARCHAR(30) NOT NULL,
  corrected_value_num NUMERIC(18,4),
  corrected_by UUID,
  corrected_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pj_extraction_field_ext ON public.tb_pj_extraction_field (extraction_id);

CREATE TABLE IF NOT EXISTS public.tb_pj_library_document (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  doc_type VARCHAR(40) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  storage_uri TEXT NOT NULL,
  retention_until DATE NOT NULL,
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pj_lib_cnpj ON public.tb_pj_library_document (cnpj);

CREATE TABLE IF NOT EXISTS public.tb_pj_library_acl (
  cnpj CHAR(14) NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(40) NOT NULL,
  PRIMARY KEY (cnpj, user_id)
);

CREATE TABLE IF NOT EXISTS public.tb_pj_rag_chunk (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  document_id UUID NOT NULL,
  page INT NOT NULL,
  start_offset INT NOT NULL,
  end_offset INT NOT NULL,
  content TEXT NOT NULL,
  embedding extensions.vector(1536) NOT NULL,
  embedding_model VARCHAR(80) NOT NULL,
  embedding_dims INT NOT NULL,
  index_version VARCHAR(40) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rag_chunk_cnpj ON public.tb_pj_rag_chunk (cnpj);
CREATE INDEX IF NOT EXISTS idx_rag_chunk_document ON public.tb_pj_rag_chunk (document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunk_cnpj_version ON public.tb_pj_rag_chunk (cnpj, index_version);
CREATE INDEX IF NOT EXISTS idx_rag_chunk_embedding ON public.tb_pj_rag_chunk
  USING hnsw (embedding extensions.vector_cosine_ops);

CREATE TABLE IF NOT EXISTS public.tb_pj_rag_answer (
  id UUID PRIMARY KEY,
  cnpj CHAR(14) NOT NULL,
  query_text TEXT NOT NULL,
  model VARCHAR(80),
  provider VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rag_answer_cnpj ON public.tb_pj_rag_answer (cnpj);

CREATE TABLE IF NOT EXISTS public.tb_pj_rag_citation (
  id UUID PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.tb_pj_rag_answer(id) ON DELETE CASCADE,
  chunk_id UUID NOT NULL REFERENCES public.tb_pj_rag_chunk(id) ON DELETE CASCADE,
  score NUMERIC(8,6) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rag_citation_answer ON public.tb_pj_rag_citation (answer_id);
"""
    )


def downgrade() -> None:
    op.execute(
        """
DROP TABLE IF EXISTS public.tb_pj_rag_citation;
DROP TABLE IF EXISTS public.tb_pj_rag_answer;
DROP TABLE IF EXISTS public.tb_pj_rag_chunk;
DROP TABLE IF EXISTS public.tb_pj_library_acl;
DROP TABLE IF EXISTS public.tb_pj_library_document;
DROP TABLE IF EXISTS public.tb_pj_extraction_field;
DROP TABLE IF EXISTS public.tb_pj_extraction;
DROP TABLE IF EXISTS public.tb_pj_document;
"""
    )
