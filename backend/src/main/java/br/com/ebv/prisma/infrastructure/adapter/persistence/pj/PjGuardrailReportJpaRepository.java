package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PjGuardrailReportJpaRepository extends JpaRepository<PjGuardrailReportEntity, UUID> {
    Optional<PjGuardrailReportEntity> findFirstByOpinionIdOrderByCreatedAtDesc(UUID opinionId);
}
