package br.com.ebv.prisma.presentation.dto.portfolio;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class PortfolioRequests {
    private PortfolioRequests() {}

    public record FilterGraphRequest(
            @NotNull UUID portfolioId,
            Integer lod,
            Integer maxNodes,
            Map<String, Object> criteria
    ) {}

    public record SimulateContagionRequest(
            @NotNull UUID portfolioId,
            @NotBlank String originNodeId,
            BigDecimal transmissionFactor,
            Integer maxWaves,
            List<String> relationTypes
    ) {}

    public record RunStressRequest(
            @NotNull UUID portfolioId,
            Map<String, Object> variables,
            Boolean compareBaseline
    ) {}

    public record UpsertLimitRequest(
            @NotNull UUID portfolioId,
            @NotBlank String dimension,
            @NotNull BigDecimal thresholdPct,
            @NotNull BigDecimal warnPct
    ) {}

    public record RefreshAggregatesRequest(
            @NotBlank String cubeName,
            String mode,
            List<String> partitions
    ) {}

    public record DetectCommunitiesRequest(
            @NotNull UUID portfolioId,
            Integer minCommunitySize,
            String algorithm
    ) {}

    public record CompareSnapshotsRequest(
            @NotNull UUID portfolioId,
            @NotNull LocalDate dateA,
            @NotNull LocalDate dateB
    ) {}

    public record ReportSectionRequest(String analysisType, String analysisRef, int sortOrder) {}

    public record CreateReportRequest(
            @NotNull UUID portfolioId,
            @NotBlank String title,
            String watermarkTo,
            List<ReportSectionRequest> sections
    ) {}
}
