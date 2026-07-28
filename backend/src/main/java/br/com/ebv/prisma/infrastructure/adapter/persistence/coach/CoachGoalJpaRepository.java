package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CoachGoalJpaRepository extends JpaRepository<CoachGoalEntity, UUID> {
    List<CoachGoalEntity> findByJourneyIdOrderByCreatedAtAsc(UUID journeyId);
}
