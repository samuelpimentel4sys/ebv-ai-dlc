package br.com.ebv.prisma.domain.onboarding.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingRepositoryPort {

    record OnboardingRecord(
            UUID id,
            String cnpj,
            String legalName,
            String representative,
            String status,
            String tenantId,
            Instant createdAt,
            Instant completedAt
    ) {}

    void save(OnboardingRecord record);

    Optional<OnboardingRecord> findById(UUID id);

    boolean existsCompletedByCnpj(String cnpj);
}
