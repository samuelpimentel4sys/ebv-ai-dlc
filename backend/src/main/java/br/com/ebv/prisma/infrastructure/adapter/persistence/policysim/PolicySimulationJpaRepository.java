package br.com.ebv.prisma.infrastructure.adapter.persistence.policysim;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PolicySimulationJpaRepository extends JpaRepository<PolicySimulationEntity, UUID> {
}
