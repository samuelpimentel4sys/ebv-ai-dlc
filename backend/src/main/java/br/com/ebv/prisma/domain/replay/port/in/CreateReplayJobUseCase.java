package br.com.ebv.prisma.domain.replay.port.in;

import java.time.Instant;
import java.util.UUID;

public interface CreateReplayJobUseCase {

    record Command(
            Instant windowStart,
            Instant windowEnd,
            String targetEnv,
            String approverId,
            String justification,
            UUID requester
    ) {}

    record Result(UUID jobId, String status, String targetEnv) {}

    Result execute(Command command);
}
