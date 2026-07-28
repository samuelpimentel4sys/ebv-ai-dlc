package br.com.ebv.prisma.domain.replay.port.in;

import java.util.UUID;

public interface AbortReplayJobUseCase {

    record Result(UUID jobId, String status) {}

    Result execute(UUID jobId);
}
