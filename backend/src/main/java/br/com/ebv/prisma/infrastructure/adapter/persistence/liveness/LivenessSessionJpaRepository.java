package br.com.ebv.prisma.infrastructure.adapter.persistence.liveness;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface LivenessSessionJpaRepository extends JpaRepository<LivenessSessionEntity, UUID> {
}
