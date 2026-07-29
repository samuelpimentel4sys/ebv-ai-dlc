from __future__ import annotations

from prisma_pj.domain.exception import ProviderNotConfiguredError
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingGateway
from prisma_pj.domain.port.outbound.llm_gateway import LlmGateway
from prisma_pj.infrastructure.ai.bedrock_embed import BedrockEmbedAdapter
from prisma_pj.infrastructure.ai.bedrock_llm import BedrockLlmAdapter
from prisma_pj.infrastructure.ai.gemini_embed import GeminiEmbedAdapter
from prisma_pj.infrastructure.ai.gemini_llm import GeminiLlmAdapter
from prisma_pj.infrastructure.ai.ollama_embed import OllamaEmbedAdapter
from prisma_pj.infrastructure.ai.ollama_llm import OllamaLlmAdapter
from prisma_pj.infrastructure.ai.openai_embed import OpenAiEmbedAdapter
from prisma_pj.infrastructure.ai.openai_llm import OpenAiLlmAdapter
from prisma_pj.infrastructure.config import InferenceProvider, Settings


def build_llm_gateway(settings: Settings) -> LlmGateway:
    provider: InferenceProvider = settings.inference_provider
    if provider == "local":
        return OllamaLlmAdapter(settings)
    if provider == "openai":
        return OpenAiLlmAdapter(settings)
    if provider == "gemini":
        return GeminiLlmAdapter(settings)
    if provider == "bedrock":
        return BedrockLlmAdapter(settings)
    raise ProviderNotConfiguredError(f"Provider desconhecido: {provider}")


def build_embedding_gateway(settings: Settings) -> EmbeddingGateway:
    provider: InferenceProvider = settings.inference_provider
    if provider == "local":
        return OllamaEmbedAdapter(settings)
    if provider == "openai":
        return OpenAiEmbedAdapter(settings)
    if provider == "gemini":
        return GeminiEmbedAdapter(settings)
    if provider == "bedrock":
        return BedrockEmbedAdapter(settings)
    raise ProviderNotConfiguredError(f"Provider desconhecido: {provider}")
