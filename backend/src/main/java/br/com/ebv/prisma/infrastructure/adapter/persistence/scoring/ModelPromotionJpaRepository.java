package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ModelPromotionJpaRepository extends JpaRepository<ModelPromotionEntity, UUID> {
}
