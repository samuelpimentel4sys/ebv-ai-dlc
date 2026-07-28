package br.com.ebv.prisma.domain.liveness.port.out;

import java.util.UUID;

public interface RekognitionLivenessPort {

    record CreatedSession(String sessionId) {}

    CreatedSession createSession(UUID customerId, String idempotencyKey);
}
