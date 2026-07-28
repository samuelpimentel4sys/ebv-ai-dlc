package br.com.ebv.prisma.domain.observability.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ObservabilityRepositoryPort {

    record TraceRecord(
            UUID decisionId,
            String clientId,
            String spanJson,
            Instant createdAt,
            Instant expiresAt
    ) {}

    record LatencySample(int latencyMs, String clientId, Instant createdAt) {}

    record SloSnapshotRecord(
            Instant at,
            String clientId,
            BigDecimal p95Ms,
            BigDecimal p99Ms,
            BigDecimal errorRate,
            BigDecimal budgetRemainingPct
    ) {}

    void saveTrace(TraceRecord record);

    Optional<TraceRecord> findTrace(UUID decisionId);

    List<LatencySample> findLatencies(Instant from, Instant to, String clientId);

    void saveSloSnapshot(SloSnapshotRecord snapshot);
}
