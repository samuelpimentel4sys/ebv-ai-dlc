from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

InferenceProvider = Literal["local", "bedrock", "openai", "gemini"]


class Settings(BaseSettings):
    """12-factor config — espelho Jarvis (sem voz/STT/TTS)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "prisma-pj"
    environment: str = "local"
    inference_provider: InferenceProvider = "local"

    database_url: str = "postgresql+asyncpg://prisma:prisma@localhost:5433/prisma_pj"
    database_ssl: str | None = None  # "require" no Supabase
    database_ssl_insecure: bool = False  # lab: CERT_NONE (jdbc sslmode=require)
    redis_url: str = "redis://localhost:6380/0"

    # RAG / pgvector (coluna canônica 1536 — US F02; pad se modelo menor)
    rag_vector_dims: int = 1536
    rag_index_version: str = "v1-local-nomic-768pad"

    # local (Ollama OpenAI-compat) — padrão Jarvis
    local_llm_base_url: str = "http://127.0.0.1:11434/v1"
    local_llm_model: str = "qwen2.5:7b"
    ollama_embed_model: str = "nomic-embed-text"
    ollama_embed_dims: int = 768
    local_llm_timeout_s: float = 60.0

    # bedrock (prod EBV canônico)
    aws_region: str = "us-east-1"
    bedrock_chat_model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"
    bedrock_embed_model_id: str = "amazon.titan-embed-text-v2:0"
    bedrock_embed_dims: int = 1024
    bedrock_runtime_endpoint: str | None = None  # override lab/mock

    # openai (análise / eval)
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    openai_embed_model: str = "text-embedding-3-small"
    openai_embed_dims: int = 1536
    openai_timeout_s: float = 60.0

    # gemini (análise / eval)
    gemini_api_key: str = ""
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_model: str = "gemini-2.5-flash"
    gemini_embed_model: str = "text-embedding-004"
    gemini_embed_dims: int = 768
    gemini_timeout_s: float = 60.0

    http_timeout_s: float = Field(default=60.0, ge=1.0)

    # OIDC / Keycloak — espelho Noah (Java). Lab: oidc_enabled=false
    oidc_enabled: bool = False
    oidc_issuer_uri: str = "http://192.168.31.47:8180/realms/prisma"
    oidc_jwk_set_uri: str = (
        "http://192.168.31.47:8180/realms/prisma/protocol/openid-connect/certs"
    )
    oidc_audience: str = ""  # vazio = não valida aud (tokens Keycloak costumam aud=account)
    oidc_client_id: str = "prisma-backend"

    # F08 grupo economico (stub Neptune ate EP-04)
    group_graph_backend: Literal["stub"] = "stub"
    group_max_nodes: int = Field(default=50, ge=2, le=500)
    group_stale_days: int = Field(default=7, ge=1, le=90)


@lru_cache
def get_settings() -> Settings:
    return Settings()
