package br.com.ebv.prisma.domain.portfolio.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PortfolioRepositoryPort {

    record GraphFilterRecord(UUID filterId, UUID portfolioId, int lod, int maxNodes, String criteriaJson, Instant createdAt) {}
    record ContagionSimRecord(String simId, UUID portfolioId, String originNodeId, BigDecimal transmissionFactor,
                              int maxWaves, String status, String premisesJson, String resultJson,
                              Instant createdAt, Instant finishedAt) {}
    record StressScenarioRecord(UUID scenarioId, String code, String kind, String label, String variablesJson) {}
    record StressRunRecord(String runId, UUID portfolioId, UUID scenarioId, String status,
                           String variablesJson, String resultJson, String aggregateVersion,
                           Instant createdAt, Instant finishedAt) {}
    record LimitRecord(UUID limitId, UUID portfolioId, String dimension, BigDecimal thresholdPct,
                       BigDecimal warnPct, Instant updatedAt) {}
    record AlertRecord(UUID alertId, UUID portfolioId, String dimension, String dimKey,
                       String severity, String status, String message, Instant createdAt) {}
    record CubeMetaRecord(String cubeName, Instant lastRefreshAt, int freshnessSlaMinutes, String status) {}
    record CubeJobRecord(String jobId, String cubeName, String mode, String status,
                         String partitionsJson, Instant createdAt, Instant finishedAt) {}
    record CommunityRunRecord(String runId, UUID portfolioId, String algorithm, int minCommunitySize,
                              String status, Instant createdAt, Instant finishedAt) {}
    record CommunityRecord(String communityId, String runId, UUID portfolioId, String label,
                           BigDecimal totalExposure, int memberCount, String membersJson) {}
    record SnapshotRecord(UUID snapshotId, UUID portfolioId, LocalDate asOfDate, String aggregateVersion,
                          String summaryJson, int nodeCount, boolean divergenceFlag) {}
    record TimelineEventRecord(UUID eventId, UUID portfolioId, Instant eventAt, String eventType,
                               String impactJson, String label) {}
    record ReportRecord(String reportId, UUID portfolioId, String title, String watermarkTo, String status,
                        String sectionsJson, String summaryJson, String downloadUrl,
                        Instant createdAt, Instant finishedAt) {}

    void saveGraphFilter(GraphFilterRecord record);
    Optional<GraphFilterRecord> findGraphFilter(UUID filterId);

    void saveContagion(ContagionSimRecord record);
    Optional<ContagionSimRecord> findContagion(String simId);
    List<ContagionSimRecord> listContagionByPortfolio(UUID portfolioId);

    List<StressScenarioRecord> listStressScenarios();
    void saveStressRun(StressRunRecord record);
    Optional<StressRunRecord> findStressRun(String runId);

    void saveLimit(LimitRecord record);
    List<LimitRecord> listLimits(UUID portfolioId);
    void saveAlert(AlertRecord record);
    List<AlertRecord> listAlerts(UUID portfolioId);

    List<CubeMetaRecord> listCubeMeta();
    Optional<CubeMetaRecord> findCubeMeta(String cubeName);
    void saveCubeMeta(CubeMetaRecord record);
    void saveCubeJob(CubeJobRecord record);

    void saveCommunityRun(CommunityRunRecord record);
    void saveCommunity(CommunityRecord record);
    List<CommunityRecord> listCommunities(UUID portfolioId);
    Optional<CommunityRecord> findCommunity(String communityId);

    Optional<SnapshotRecord> findSnapshot(UUID portfolioId, LocalDate asOf);
    void saveSnapshot(SnapshotRecord record);
    List<TimelineEventRecord> listTimeline(UUID portfolioId);

    void saveReport(ReportRecord record);
    Optional<ReportRecord> findReport(String reportId);
}
