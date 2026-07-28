package br.com.ebv.prisma.infrastructure.adapter.persistence.sla;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SlaPolicyJpaRepository extends JpaRepository<SlaPolicyEntity, UUID> {
    Optional<SlaPolicyEntity> findFirstByStatus(String status);
}
