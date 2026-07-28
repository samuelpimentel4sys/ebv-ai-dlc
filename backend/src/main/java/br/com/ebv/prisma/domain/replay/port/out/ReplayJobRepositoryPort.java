package br.com.ebv.prisma.domain.replay.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface ReplayJobRepositoryPort {

    record ReplayJobRecord(
            UUID id,
            Instant windowStart,
            Instant windowEnd,
            String status,
            UUID requester,
            UUID approver,
            String justification,
            String outputUri,
            String targetEnv,
            Instant createdAt,
            Instant finishedAt
    ) {}

    void save(ReplayJobRecord record);

    Optional<ReplayJobRecord> findById(UUID id);
}
