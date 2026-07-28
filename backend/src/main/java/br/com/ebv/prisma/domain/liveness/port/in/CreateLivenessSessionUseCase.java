package br.com.ebv.prisma.domain.liveness.port.in;

import java.time.Instant;
import java.util.UUID;

public interface CreateLivenessSessionUseCase {

    record DeviceInfo(String platform, String appVersion, String ipAddress, String deviceId) {}

    record Command(
            UUID customerId,
            UUID actorCustomerId,
            DeviceInfo device,
            String channel,
            String idempotencyKey,
            String payloadHash
    ) {}

    record Result(
            String sessionId,
            UUID customerId,
            String status,
            Instant createdAt,
            Instant expiresAt,
            boolean fromCache
    ) {}

    Result execute(Command command);
}
