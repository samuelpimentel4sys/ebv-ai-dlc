import uvicorn
from fastapi import FastAPI

from prisma_pj.presentation.api.deps import lifespan
from prisma_pj.presentation.api.v1.health import router as health_router
from prisma_pj.presentation.api.v1.pj_copilot import router as pj_copilot_router
from prisma_pj.presentation.api.v1.pj_documents import router as pj_documents_router
from prisma_pj.presentation.api.v1.pj_group import router as pj_group_router
from prisma_pj.presentation.api.v1.pj_rag import router as pj_rag_router
from prisma_pj.presentation.api.v1.pj_routing import router as pj_routing_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Prisma PJ Copiloto GenAI",
        description="PRISMA-EP-03 — núcleo Python (multi-provider LLM, sem voz)",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.include_router(health_router)
    app.include_router(pj_routing_router)
    app.include_router(pj_documents_router)
    app.include_router(pj_group_router)
    app.include_router(pj_rag_router)
    app.include_router(pj_copilot_router)
    return app


app = create_app()


def run() -> None:
    uvicorn.run(
        "prisma_pj.presentation.main:app",
        host="0.0.0.0",
        port=8090,
        reload=False,
    )
