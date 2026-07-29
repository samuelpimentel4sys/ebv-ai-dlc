# ADR-001 — Multi-provider LLM (sem voz)

**Status:** Aceito  
**Data:** 2026-07-28  
**Contexto:** PRISMA-EP-03 Copiloto GenAI PJ

## Decisão

Expor inferência via ports `LlmGateway` e `EmbeddingGateway` (`typing.Protocol`).  
Adapters: `local` (Ollama), `bedrock`, `openai`, `gemini`.  
Seleção por `INFERENCE_PROVIDER` (pydantic-settings).  
Domain/application nunca importam httpx/boto3/SDKs de cloud.

## Consequências

- Lab funciona sem AWS (`local`).
- Docs canônicos citam Bedrock → adapter prod mantido desde P0.
- OpenAI/Gemini só para análise/eval de qualidade.
- Dimensões de embedding diferem por provider → **reindex obrigatório** (RN004 F02).
- Bedrock P0 usa `BEDROCK_RUNTIME_ENDPOINT` (mock); SigV4/boto3 em staging.

## Não-decisões

- STT/TTS / voice gateway (descartado — não usado no Prisma PJ).
- Variantes Jarvis `*-llm` / `*-full` (só existiam por áudio).
