package br.com.ebv.prisma.domain.credential.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CredentialRepositoryPort {

    record CredentialRecord(
            UUID id,
            String clientId,
            String secretHash,
            String scopesJson,
            String env,
            String status,
            int rateLimit,
            String tenantId,
            Instant createdAt,
            Instant rotatedAt
    ) {}

    void save(CredentialRecord record);

    Optional<CredentialRecord> findById(UUID id);
}
