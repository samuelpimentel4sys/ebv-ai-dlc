package br.com.ebv.prisma.domain.fairness.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListFairnessAlertsUseCase {

    record Query(String severity, String status, String modelVersion, int page, int size) {}

    record Item(
            UUID alertId,
            UUID metricId,
            String modelVersion,
            String severity,
            String status,
            String message,
            Instant openedAt
    ) {}

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
