package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisputeTimelineJpaRepository extends JpaRepository<DisputeTimelineEntity, Long> {

    List<DisputeTimelineEntity> findByDisputeIdOrderByAtAsc(UUID disputeId);
}
