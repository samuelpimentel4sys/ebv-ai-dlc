package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface PfTimelineEventJpaRepository extends JpaRepository<PfTimelineEventEntity, UUID> {
    List<PfTimelineEventEntity> findByPortfolioIdOrderByEventAtDesc(UUID portfolioId);
}
