package br.com.ebv.prisma.domain.fairness.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FairnessRepositoryPort {

    record RunRecord(
            UUID id,
            String modelVersion,
            LocalDate windowFrom,
            LocalDate windowTo,
            String thresholdProfile,
            String status,
            String segmentsJson,
            String metricsRequestedJson,
            Instant submittedAt,
            Instant finishedAt
    ) {}

    record MetricRecord(
            UUID id,
            UUID runId,
            String modelVersion,
            String metricName,
            String segmentName,
            String groupCode,
            BigDecimal metricValue,
            BigDecimal approvedLimit,
            boolean exceeded,
            Instant createdAt
    ) {}

    record AlertRecord(
            UUID id,
            UUID metricId,
            String modelVersion,
            String severity,
            String status,
            String message,
            Instant openedAt
    ) {}

    record MetricPage(List<MetricRecord> items, int page, int size, long totalElements, int totalPages) {}

    record AlertPage(List<AlertRecord> items, int page, int size, long totalElements, int totalPages) {}

    void saveRun(RunRecord record);

    void saveMetric(MetricRecord record);

    void saveAlert(AlertRecord record);

    Optional<RunRecord> findRunById(UUID id);

    MetricPage searchMetrics(String modelVersion, String metric, String segment, LocalDate from, LocalDate to, int page, int size);

    AlertPage searchAlerts(String severity, String status, String modelVersion, int page, int size);
}
