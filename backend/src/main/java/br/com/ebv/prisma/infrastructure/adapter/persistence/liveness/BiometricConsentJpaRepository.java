package br.com.ebv.prisma.infrastructure.adapter.persistence.liveness;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BiometricConsentJpaRepository extends JpaRepository<BiometricConsentEntity, UUID> {

    boolean existsByCustomerIdAndStatus(UUID customerId, String status);

    Optional<BiometricConsentEntity> findByCustomerIdAndTermVersion(UUID customerId, String termVersion);
}
