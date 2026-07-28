package br.com.ebv.prisma.domain.replay.port.in;

import java.time.Instant;
import java.util.UUID;

public interface GetReplayJobUseCase {

    record Result(
            UUID jobId,
            Instant windowStart,
            Instant windowEnd,
            String status,
            String targetEnv,
            String outputUri,
            String justification,
            Instant createdAt,
            Instant finishedAt
    ) {}

    Result execute(UUID jobId);
}
