package br.com.ebv.prisma.domain.dispute.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisputeRepositoryPort {

    record DisputeRecord(
            UUID id,
            String protocol,
            String documento,
            String status,
            String reasonCode,
            String description,
            String channel,
            Instant dueAt,
            Instant resolvedAt,
            String resolutionOutcome,
            String resolutionRationale,
            Instant createdAt
    ) {}

    record TimelineEvent(
            Long id,
            UUID disputeId,
            String eventType,
            String message,
            String actor,
            Instant at
    ) {}

    record PageResult(List<DisputeRecord> items, int page, int size, long totalElements, int totalPages) {}

    void save(DisputeRecord record);

    void appendTimeline(UUID disputeId, String eventType, String message, String actor, Instant at);

    Optional<DisputeRecord> findById(UUID id);

    Optional<DisputeRecord> findByProtocol(String protocol);

    PageResult queueByDueAt(int page, int size);

    List<TimelineEvent> timelineByDisputeId(UUID disputeId);
}
