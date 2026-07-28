package br.com.ebv.prisma.infrastructure.adapter.persistence.liveness;

import br.com.ebv.prisma.domain.liveness.port.out.LivenessRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LivenessRepositoryAdapter implements LivenessRepositoryPort {

    private final BiometricConsentJpaRepository consentRepo;
    private final LivenessSessionJpaRepository sessionRepo;
    private final BiometricLockoutJpaRepository lockoutRepo;
    private final Map<String, IdempotentEntry> idempotency = new ConcurrentHashMap<>();

    public LivenessRepositoryAdapter(
            BiometricConsentJpaRepository consentRepo,
            LivenessSessionJpaRepository sessionRepo,
            BiometricLockoutJpaRepository lockoutRepo
    ) {
        this.consentRepo = consentRepo;
        this.sessionRepo = sessionRepo;
        this.lockoutRepo = lockoutRepo;
    }

    @Override
    public boolean hasActiveConsent(UUID customerId) {
        return consentRepo.existsByCustomerIdAndStatus(customerId, "ACTIVE");
    }

    @Override
    @Transactional
    public void upsertActiveConsent(UUID customerId, String termVersion, String ip, String userAgent) {
        Instant now = Instant.now();
        var existing = consentRepo.findByCustomerIdAndTermVersion(customerId, termVersion);
        BiometricConsentEntity e = existing.orElseGet(BiometricConsentEntity::new);
        if (e.getId() == null) {
            e.setId(UUID.randomUUID());
            e.setCreatedAt(now);
            e.setCustomerId(customerId);
            e.setTermVersion(termVersion);
        }
        e.setStatus("ACTIVE");
        e.setConsentedAt(now);
        e.setRevokedAt(null);
        e.setIpAddress(ip);
        e.setUserAgent(userAgent);
        e.setUpdatedAt(now);
        consentRepo.save(e);
    }

    @Override
    public boolean hasActiveLockout(UUID customerId) {
        return lockoutRepo.existsActiveLockout(customerId, Instant.now());
    }

    @Override
    public Optional<IdempotentPayload> findIdempotent(String idempotencyKey) {
        IdempotentEntry e = idempotency.get(idempotencyKey);
        if (e == null || e.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(e.payload());
    }

    @Override
    public void saveIdempotent(String idempotencyKey, String payloadHash, IdempotentPayload payload) {
        idempotency.put(idempotencyKey, new IdempotentEntry(
                payloadHash, payload, Instant.now().plusSeconds(24 * 3600)
        ));
    }

    @Override
    public Optional<String> findIdempotentPayloadHash(String idempotencyKey) {
        IdempotentEntry e = idempotency.get(idempotencyKey);
        if (e == null || e.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(e.payloadHash());
    }

    @Override
    @Transactional
    public SessionView saveSession(SessionView session) {
        LivenessSessionEntity e = new LivenessSessionEntity();
        e.setId(session.id());
        e.setSessionId(session.sessionId());
        e.setCustomerId(session.customerId());
        e.setStatus(session.status());
        e.setChannel(session.channel());
        e.setPlatform(session.platform());
        e.setAppVersion(session.appVersion());
        e.setIpAddress(session.ipAddress());
        e.setCreatedAt(session.createdAt());
        e.setUpdatedAt(session.createdAt());
        e.setExpiresAt(session.expiresAt());
        sessionRepo.save(e);
        return session;
    }

    private record IdempotentEntry(String payloadHash, IdempotentPayload payload, Instant expiresAt) {}
}
