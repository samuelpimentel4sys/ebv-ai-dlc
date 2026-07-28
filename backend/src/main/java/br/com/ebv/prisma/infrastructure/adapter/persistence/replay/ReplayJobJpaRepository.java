package br.com.ebv.prisma.infrastructure.adapter.persistence.replay;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReplayJobJpaRepository extends JpaRepository<ReplayJobEntity, UUID> {
}
