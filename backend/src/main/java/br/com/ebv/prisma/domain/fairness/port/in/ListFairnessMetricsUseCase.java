package br.com.ebv.prisma.domain.fairness.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ListFairnessMetricsUseCase {

    record Query(String modelVersion, String metric, String segment, LocalDate from, LocalDate to, int page, int size) {}

    record Item(
            UUID metricId,
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

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
