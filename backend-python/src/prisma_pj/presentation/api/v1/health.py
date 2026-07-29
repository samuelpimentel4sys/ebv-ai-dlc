from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.application.use_case.smoke_llm import SmokeLlm, SmokeLlmCommand
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingGateway
from prisma_pj.domain.port.outbound.llm_gateway import LlmGateway
from prisma_pj.infrastructure.config import Settings, get_settings
from prisma_pj.infrastructure.persistence.rag_repository import ping_database
from prisma_pj.presentation.api.deps import get_db_session, get_embeddings, get_llm, get_smoke_llm
from prisma_pj.presentation.security.deps import RequireAnalistaPj

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name, "env": settings.environment}


@router.get("/ready")
async def ready(
    settings: Annotated[Settings, Depends(get_settings)],
    llm: Annotated[LlmGateway, Depends(get_llm)],
    embeddings: Annotated[EmbeddingGateway, Depends(get_embeddings)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict[str, Any]:
    llm_ok = await llm.health()
    emb_ok = await embeddings.health()
    db_ok = await ping_database(session)
    status = "ready" if (llm_ok and db_ok) else "degraded"
    return {
        "status": status,
        "provider": settings.inference_provider,
        "database": {"ok": db_ok},
        "llm": {"ok": llm_ok, "model": llm.model_name},
        "embeddings": {
            "ok": emb_ok,
            "model": embeddings.model_name,
            "dims": embeddings.dimensions,
        },
        "rag": {
            "vectorDims": settings.rag_vector_dims,
            "indexVersion": settings.rag_index_version,
        },
    }


@router.post("/api/v1/pj/smoke/llm")
async def smoke_llm(
    body: dict[str, str],
    use_case: Annotated[SmokeLlm, Depends(get_smoke_llm)],
    _principal: RequireAnalistaPj,
) -> dict[str, Any]:
    prompt = body.get("prompt", "Diga ok.")
    result = await use_case.execute(SmokeLlmCommand(prompt=prompt))
    return {
        "content": result.content,
        "provider": result.provider,
        "model": result.model,
        "tokensIn": result.tokens_in,
        "tokensOut": result.tokens_out,
        "latencyMs": result.latency_ms,
    }
