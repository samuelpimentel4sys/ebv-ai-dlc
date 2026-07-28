package br.com.ebv.prisma.infrastructure.adapter.persistence.fairness;

import br.com.ebv.prisma.domain.fairness.port.out.FairnessRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class FairnessRepositoryAdapter implements FairnessRepositoryPort {

    private final FairnessRunJpaRepository runJpa;
    private final FairnessMetricJpaRepository metricJpa;
    private final FairnessAlertJpaRepository alertJpa;

    public FairnessRepositoryAdapter(
            FairnessRunJpaRepository runJpa,
            FairnessMetricJpaRepository metricJpa,
            FairnessAlertJpaRepository alertJpa
    ) {
        this.runJpa = runJpa;
        this.metricJpa = metricJpa;
        this.alertJpa = alertJpa;
    }

    @Override
    public void saveRun(RunRecord record) {
        FairnessRunEntity e = new FairnessRunEntity();
        e.setId(record.id());
        e.setModelVersion(record.modelVersion());
        e.setWindowFrom(record.windowFrom());
        e.setWindowTo(record.windowTo());
        e.setThresholdProfile(record.thresholdProfile());
        e.setStatus(record.status());
        e.setSegmentsJson(record.segmentsJson());
        e.setMetricsRequestedJson(record.metricsRequestedJson());
        e.setSubmittedAt(OffsetDateTime.ofInstant(record.submittedAt(), ZoneOffset.UTC));
        e.setFinishedAt(record.finishedAt() == null ? null : OffsetDateTime.ofInstant(record.finishedAt(), ZoneOffset.UTC));
        runJpa.save(e);
    }

    @Override
    public void saveMetric(MetricRecord record) {
        FairnessMetricEntity e = new FairnessMetricEntity();
        e.setId(record.id());
        e.setRunId(record.runId());
        e.setModelVersion(record.modelVersion());
        e.setMetricName(record.metricName());
        e.setSegmentName(record.segmentName());
        e.setGroupCode(record.groupCode());
        e.setMetricValue(record.metricValue());
        e.setApprovedLimit(record.approvedLimit());
        e.setExceeded(record.exceeded());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        metricJpa.save(e);
    }

    @Override
    public void saveAlert(AlertRecord record) {
        FairnessAlertEntity e = new FairnessAlertEntity();
        e.setId(record.id());
        e.setMetricId(record.metricId());
        e.setModelVersion(record.modelVersion());
        e.setSeverity(record.severity());
        e.setStatus(record.status());
        e.setMessage(record.message());
        e.setOpenedAt(OffsetDateTime.ofInstant(record.openedAt(), ZoneOffset.UTC));
        alertJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RunRecord> findRunById(UUID id) {
        return runJpa.findById(id).map(e -> new RunRecord(
                e.getId(), e.getModelVersion(), e.getWindowFrom(), e.getWindowTo(),
                e.getThresholdProfile(), e.getStatus(), e.getSegmentsJson(), e.getMetricsRequestedJson(),
                e.getSubmittedAt().toInstant(),
                e.getFinishedAt() == null ? null : e.getFinishedAt().toInstant()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public MetricPage searchMetrics(String modelVersion, String metric, String segment,
                                    LocalDate from, LocalDate to, int page, int size) {
        List<FairnessMetricEntity> all = metricJpa.search(
                blankToNull(modelVersion), blankToNull(metric), blankToNull(segment)
        ).stream()
                .filter(m -> from == null || !m.getCreatedAt().toLocalDate().isBefore(from))
                .filter(m -> to == null || !m.getCreatedAt().toLocalDate().isAfter(to))
                .toList();
        return pageMetrics(all, page, size);
    }

    @Override
    @Transactional(readOnly = true)
    public AlertPage searchAlerts(String severity, String status, String modelVersion, int page, int size) {
        List<FairnessAlertEntity> all = alertJpa.search(
                blankToNull(severity), blankToNull(status), blankToNull(modelVersion)
        );
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<AlertRecord> items = all.subList(fromIdx, toIdx).stream()
                .map(a -> new AlertRecord(
                        a.getId(), a.getMetricId(), a.getModelVersion(), a.getSeverity(),
                        a.getStatus(), a.getMessage(), a.getOpenedAt().toInstant()
                ))
                .toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new AlertPage(items, page, size, total, totalPages);
    }

    private MetricPage pageMetrics(List<FairnessMetricEntity> all, int page, int size) {
        long total = all.size();
        int fromIdx = Math.min(page * size, all.size());
        int toIdx = Math.min(fromIdx + size, all.size());
        List<MetricRecord> items = all.subList(fromIdx, toIdx).stream()
                .map(m -> new MetricRecord(
                        m.getId(), m.getRunId(), m.getModelVersion(), m.getMetricName(),
                        m.getSegmentName(), m.getGroupCode(), m.getMetricValue(), m.getApprovedLimit(),
                        m.isExceeded(), m.getCreatedAt().toInstant()
                ))
                .toList();
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) total / size);
        return new MetricPage(items, page, size, total, totalPages);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
