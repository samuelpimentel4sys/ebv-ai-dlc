package br.com.ebv.prisma.domain.thinfile.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ThinfileRepositoryPort {

    record ModelCard(
            String modelVersion, Instant trainedAt, Instant validatedAt, String populationDesc,
            BigDecimal auc, BigDecimal confidenceFloor, String limitationsJson, boolean active
    ) {}

    record ScoreRecord(
            UUID scoreId, String documentoHash, String modelVersion, int scoreValue,
            String confidenceBand, boolean thinFileFlag, boolean routedToTraditional,
            Instant calculatedAt, UUID correlationId
    ) {}

    record MonitoringRun(
            UUID runId, String modelVersion, Instant startedAt, Instant finishedAt, String status,
            BigDecimal aucCurrent, BigDecimal aucBaseline, BigDecimal degradationPct
    ) {}

    record DriftMetric(UUID metricId, UUID runId, String featureName, BigDecimal psi,
                       boolean vulnerableSegment, String severity) {}

    Optional<ModelCard> findActiveModelCard();
    void saveScore(ScoreRecord record);
    Optional<ScoreRecord> findLatestScore(String documentoHash);
    void saveMonitoringRun(MonitoringRun run);
    void saveDrift(DriftMetric metric);
    List<MonitoringRun> findMonitoringRuns();
    List<DriftMetric> findDriftByRun(UUID runId);
    Optional<MonitoringRun> findLatestRun();
}
