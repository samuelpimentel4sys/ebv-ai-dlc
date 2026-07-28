package br.com.ebv.prisma.domain.liveness.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface LivenessRepositoryPort {

    record ConsentView(UUID id, UUID customerId, String termVersion, String status) {}

    record SessionView(
            UUID id,
            String sessionId,
            UUID customerId,
            String status,
            Instant createdAt,
            Instant expiresAt,
            String channel,
            String platform,
            String appVersion,
            String ipAddress
    ) {}

    record IdempotentPayload(
            String sessionId,
            UUID customerId,
            String status,
            Instant createdAt,
            Instant expiresAt
    ) {}

    boolean hasActiveConsent(UUID customerId);

    void upsertActiveConsent(UUID customerId, String termVersion, String ip, String userAgent);

    boolean hasActiveLockout(UUID customerId);

    Optional<IdempotentPayload> findIdempotent(String idempotencyKey);

    void saveIdempotent(String idempotencyKey, String payloadHash, IdempotentPayload payload);

    Optional<String> findIdempotentPayloadHash(String idempotencyKey);

    SessionView saveSession(SessionView session);
}
