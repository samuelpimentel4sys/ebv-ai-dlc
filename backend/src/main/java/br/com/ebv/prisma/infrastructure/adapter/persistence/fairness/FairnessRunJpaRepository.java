package br.com.ebv.prisma.infrastructure.adapter.persistence.fairness;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FairnessRunJpaRepository extends JpaRepository<FairnessRunEntity, UUID> {
}
