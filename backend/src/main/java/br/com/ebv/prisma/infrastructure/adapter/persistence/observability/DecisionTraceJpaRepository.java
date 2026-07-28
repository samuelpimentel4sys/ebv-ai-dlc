package br.com.ebv.prisma.infrastructure.adapter.persistence.observability;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DecisionTraceJpaRepository extends JpaRepository<DecisionTraceEntity, UUID> {
}
