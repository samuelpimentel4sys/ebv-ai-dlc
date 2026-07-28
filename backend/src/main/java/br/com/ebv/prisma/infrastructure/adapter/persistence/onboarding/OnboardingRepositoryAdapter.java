package br.com.ebv.prisma.infrastructure.adapter.persistence.onboarding;

import br.com.ebv.prisma.domain.onboarding.port.out.OnboardingRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class OnboardingRepositoryAdapter implements OnboardingRepositoryPort {

    private final OnboardingJpaRepository jpa;

    public OnboardingRepositoryAdapter(OnboardingJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(OnboardingRecord record) {
        OnboardingEntity e = new OnboardingEntity();
        e.setId(record.id());
        e.setCnpj(record.cnpj());
        e.setLegalName(record.legalName());
        e.setRepresentative(record.representative());
        e.setStatus(record.status());
        e.setTenantId(record.tenantId());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        e.setCompletedAt(record.completedAt() == null ? null : OffsetDateTime.ofInstant(record.completedAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OnboardingRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsCompletedByCnpj(String cnpj) {
        return jpa.existsByCnpjAndStatus(cnpj, "COMPLETED");
    }

    private OnboardingRecord toRecord(OnboardingEntity e) {
        return new OnboardingRecord(
                e.getId(), e.getCnpj(), e.getLegalName(), e.getRepresentative(), e.getStatus(),
                e.getTenantId(), e.getCreatedAt().toInstant(),
                e.getCompletedAt() == null ? null : e.getCompletedAt().toInstant()
        );
    }
}
