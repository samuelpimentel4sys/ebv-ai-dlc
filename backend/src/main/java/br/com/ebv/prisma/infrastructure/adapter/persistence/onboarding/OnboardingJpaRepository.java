package br.com.ebv.prisma.infrastructure.adapter.persistence.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OnboardingJpaRepository extends JpaRepository<OnboardingEntity, UUID> {
    boolean existsByCnpjAndStatus(String cnpj, String status);
}
