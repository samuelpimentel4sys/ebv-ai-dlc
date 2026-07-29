from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

from prisma_pj.application.use_case.copilot import (
    CalculateRatios,
    GenerateOpinion,
    GetGuardrailReport,
    GetOpinion,
    ListRatioBenchmarks,
    ListRatiosByCnpj,
    PatchOpinion,
    VerifyOpinionGuardrails,
)
from prisma_pj.application.use_case.extraction import (
    CorrectExtractionField,
    GetExtraction,
    UploadAndExtractDocument,
)
from prisma_pj.application.use_case.group import GetGroupExposure, GetRelatedParties, RefreshGroup
from prisma_pj.application.use_case.rag import (
    CreateLibraryDocument,
    DeleteLibraryDocument,
    GetRagCitations,
    IndexRagDocument,
    ListLibraryByCnpj,
    QueryRag,
)
from prisma_pj.application.use_case.routing import (
    GetCostTelemetry,
    ListRoutingDecisions,
    ResolveAndRecordRoute,
    UpsertRoutingPolicy,
)
from prisma_pj.application.use_case.smoke_llm import SmokeLlm
from prisma_pj.domain.port.outbound.embedding_gateway import EmbeddingGateway
from prisma_pj.domain.port.outbound.group_graph import GroupGraphGateway
from prisma_pj.domain.port.outbound.llm_gateway import LlmGateway
from prisma_pj.infrastructure.ai.factory import build_embedding_gateway, build_llm_gateway
from prisma_pj.infrastructure.config import Settings, get_settings
from prisma_pj.infrastructure.graph.stub_neptune import StubNeptuneGateway
from prisma_pj.infrastructure.persistence.db import (
    get_session_factory,
    reset_db_caches,
    session_scope,
)
from prisma_pj.infrastructure.persistence.extraction_repository import (
    SqlAlchemyExtractionRepository,
)
from prisma_pj.infrastructure.persistence.group_repository import SqlAlchemyGroupRepository
from prisma_pj.infrastructure.persistence.opinion_repository import (
    SqlAlchemyGuardrailRepository,
    SqlAlchemyOpinionRepository,
)
from prisma_pj.infrastructure.persistence.rag_repository import (
    SqlAlchemyLibraryRepository,
    SqlAlchemyRagChunkRepository,
)
from prisma_pj.infrastructure.persistence.ratio_repository import SqlAlchemyRatioRepository
from prisma_pj.infrastructure.persistence.routing_repository import SqlAlchemyRoutingRepository


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async for session in session_scope():
        yield session


def get_llm(settings: Annotated[Settings, Depends(get_settings)]) -> LlmGateway:
    return build_llm_gateway(settings)


def get_embeddings(settings: Annotated[Settings, Depends(get_settings)]) -> EmbeddingGateway:
    return build_embedding_gateway(settings)


def get_smoke_llm(llm: Annotated[LlmGateway, Depends(get_llm)]) -> SmokeLlm:
    return SmokeLlm(llm)


def get_index_rag(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    embeddings: Annotated[EmbeddingGateway, Depends(get_embeddings)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> IndexRagDocument:
    return IndexRagDocument(
        SqlAlchemyRagChunkRepository(session),
        embeddings,
        index_version=settings.rag_index_version,
        canonical_dims=settings.rag_vector_dims,
    )


def get_query_rag(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    embeddings: Annotated[EmbeddingGateway, Depends(get_embeddings)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> QueryRag:
    return QueryRag(
        SqlAlchemyRagChunkRepository(session),
        embeddings,
        index_version=settings.rag_index_version,
        canonical_dims=settings.rag_vector_dims,
    )


def get_rag_citations(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GetRagCitations:
    return GetRagCitations(SqlAlchemyRagChunkRepository(session))


def get_create_library(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CreateLibraryDocument:
    return CreateLibraryDocument(SqlAlchemyLibraryRepository(session))


def get_list_library(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ListLibraryByCnpj:
    return ListLibraryByCnpj(SqlAlchemyLibraryRepository(session))


def get_delete_library(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DeleteLibraryDocument:
    return DeleteLibraryDocument(SqlAlchemyLibraryRepository(session))


def get_calculate_ratios(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CalculateRatios:
    return CalculateRatios(SqlAlchemyRatioRepository(session))


def get_list_ratios(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ListRatiosByCnpj:
    return ListRatiosByCnpj(SqlAlchemyRatioRepository(session))


def get_list_benchmarks(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ListRatioBenchmarks:
    return ListRatioBenchmarks(SqlAlchemyRatioRepository(session))


def get_generate_opinion(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    llm: Annotated[LlmGateway, Depends(get_llm)],
    embeddings: Annotated[EmbeddingGateway, Depends(get_embeddings)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> GenerateOpinion:
    query_rag = QueryRag(
        SqlAlchemyRagChunkRepository(session),
        embeddings,
        index_version=settings.rag_index_version,
        canonical_dims=settings.rag_vector_dims,
    )
    return GenerateOpinion(SqlAlchemyOpinionRepository(session), llm, query_rag)


def get_get_opinion(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GetOpinion:
    return GetOpinion(SqlAlchemyOpinionRepository(session))


def get_patch_opinion(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PatchOpinion:
    return PatchOpinion(SqlAlchemyOpinionRepository(session))


def get_verify_guardrails(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> VerifyOpinionGuardrails:
    return VerifyOpinionGuardrails(
        SqlAlchemyOpinionRepository(session),
        SqlAlchemyGuardrailRepository(session),
    )


def get_guardrail_report(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GetGuardrailReport:
    return GetGuardrailReport(SqlAlchemyGuardrailRepository(session))


def get_group_graph(
    settings: Annotated[Settings, Depends(get_settings)],
) -> GroupGraphGateway:
    _ = settings.group_graph_backend  # reserved for neo4j adapter
    return StubNeptuneGateway()


def get_group_exposure(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    graph: Annotated[GroupGraphGateway, Depends(get_group_graph)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> GetGroupExposure:
    return GetGroupExposure(
        SqlAlchemyGroupRepository(session),
        graph,
        max_nodes=settings.group_max_nodes,
        stale_days=settings.group_stale_days,
    )


def get_related_parties(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GetRelatedParties:
    return GetRelatedParties(SqlAlchemyGroupRepository(session))


def get_refresh_group(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    graph: Annotated[GroupGraphGateway, Depends(get_group_graph)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> RefreshGroup:
    return RefreshGroup(
        SqlAlchemyGroupRepository(session),
        graph,
        max_nodes=settings.group_max_nodes,
    )


def get_upsert_routing_policy(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UpsertRoutingPolicy:
    return UpsertRoutingPolicy(SqlAlchemyRoutingRepository(session))


def get_cost_telemetry(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GetCostTelemetry:
    return GetCostTelemetry(SqlAlchemyRoutingRepository(session))


def get_list_routing_decisions(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ListRoutingDecisions:
    return ListRoutingDecisions(SqlAlchemyRoutingRepository(session))


def get_resolve_route(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ResolveAndRecordRoute:
    return ResolveAndRecordRoute(
        SqlAlchemyRoutingRepository(session),
        provider=settings.inference_provider,
    )


def get_upload_extract(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UploadAndExtractDocument:
    return UploadAndExtractDocument(SqlAlchemyExtractionRepository(session))


def get_extraction(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> GetExtraction:
    return GetExtraction(SqlAlchemyExtractionRepository(session))


def get_correct_extraction(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CorrectExtractionField:
    return CorrectExtractionField(SqlAlchemyExtractionRepository(session))


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    get_session_factory()
    yield
    reset_db_caches()
    get_settings.cache_clear()
