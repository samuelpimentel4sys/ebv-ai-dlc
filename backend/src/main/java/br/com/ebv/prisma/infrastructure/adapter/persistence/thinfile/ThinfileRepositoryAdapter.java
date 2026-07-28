package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ThinfileRepositoryAdapter implements ThinfileRepositoryPort {

    private final ThinfileModelCardJpaRepository modelCardJpa;
    private final ThinfileScoreJpaRepository scoreJpa;
    private final TfMonitoringRunJpaRepository runJpa;
    private final TfDriftMetricJpaRepository driftJpa;

    public ThinfileRepositoryAdapter(
            ThinfileModelCardJpaRepository modelCardJpa,
            ThinfileScoreJpaRepository scoreJpa,
            TfMonitoringRunJpaRepository runJpa,
            TfDriftMetricJpaRepository driftJpa
    ) {
        this.modelCardJpa = modelCardJpa;
        this.scoreJpa = scoreJpa;
        this.runJpa = runJpa;
        this.driftJpa = driftJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ModelCard> findActiveModelCard() {
        return modelCardJpa.findFirstByActiveTrue().map(e -> new ModelCard(
                e.getModelVersion(), e.getTrainedAt().toInstant(), e.getValidatedAt().toInstant(),
                e.getPopulationDesc(), e.getAuc(), e.getConfidenceFloor(), e.getLimitationsJson(),
                Boolean.TRUE.equals(e.getActive())
        ));
    }

    @Override
    public void saveScore(ScoreRecord record) {
        ThinfileScoreEntity e = new ThinfileScoreEntity();
        e.setScoreId(record.scoreId());
        e.setDocumentoHash(record.documentoHash());
        e.setModelVersion(record.modelVersion());
        e.setScoreValue(record.scoreValue());
        e.setConfidenceBand(record.confidenceBand());
        e.setThinFileFlag(record.thinFileFlag());
        e.setRoutedToTraditional(record.routedToTraditional());
        e.setCalculatedAt(OffsetDateTime.ofInstant(record.calculatedAt(), ZoneOffset.UTC));
        e.setCorrelationId(record.correlationId());
        scoreJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ScoreRecord> findLatestScore(String documentoHash) {
        return scoreJpa.findFirstByDocumentoHashOrderByCalculatedAtDesc(documentoHash).map(e -> new ScoreRecord(
                e.getScoreId(), e.getDocumentoHash(), e.getModelVersion(), e.getScoreValue(),
                e.getConfidenceBand(), e.getThinFileFlag(), e.getRoutedToTraditional(),
                e.getCalculatedAt().toInstant(), e.getCorrelationId()
        ));
    }

    @Override
    public void saveMonitoringRun(MonitoringRun run) {
        TfMonitoringRunEntity e = new TfMonitoringRunEntity();
        e.setRunId(run.runId());
        e.setModelVersion(run.modelVersion());
        e.setStartedAt(OffsetDateTime.ofInstant(run.startedAt(), ZoneOffset.UTC));
        e.setFinishedAt(run.finishedAt() == null ? null : OffsetDateTime.ofInstant(run.finishedAt(), ZoneOffset.UTC));
        e.setStatus(run.status());
        e.setAucCurrent(run.aucCurrent());
        e.setAucBaseline(run.aucBaseline());
        e.setDegradationPct(run.degradationPct());
        runJpa.save(e);
    }

    @Override
    public void saveDrift(DriftMetric metric) {
        TfDriftMetricEntity e = new TfDriftMetricEntity();
        e.setMetricId(metric.metricId());
        e.setRunId(metric.runId());
        e.setFeatureName(metric.featureName());
        e.setPsi(metric.psi());
        e.setVulnerableSegment(metric.vulnerableSegment());
        e.setSeverity(metric.severity());
        driftJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonitoringRun> findMonitoringRuns() {
        return runJpa.findAllByOrderByStartedAtDesc().stream().map(this::toRun).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriftMetric> findDriftByRun(UUID runId) {
        return driftJpa.findByRunId(runId).stream()
                .map(e -> new DriftMetric(e.getMetricId(), e.getRunId(), e.getFeatureName(),
                        e.getPsi(), e.getVulnerableSegment(), e.getSeverity()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MonitoringRun> findLatestRun() {
        return runJpa.findFirstByOrderByStartedAtDesc().map(this::toRun);
    }

    private MonitoringRun toRun(TfMonitoringRunEntity e) {
        return new MonitoringRun(
                e.getRunId(), e.getModelVersion(), e.getStartedAt().toInstant(),
                e.getFinishedAt() == null ? null : e.getFinishedAt().toInstant(),
                e.getStatus(), e.getAucCurrent(), e.getAucBaseline(), e.getDegradationPct()
        );
    }
}
