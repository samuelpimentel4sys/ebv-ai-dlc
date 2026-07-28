package br.com.ebv.prisma.infrastructure.adapter.persistence.sla;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface SlaEscalationJpaRepository extends JpaRepository<SlaEscalationEntity, UUID> {

    List<SlaEscalationEntity> findAllByOrderByNotifiedAtDesc();

    @Query("""
            SELECT COUNT(e) > 0 FROM SlaEscalationEntity e
            WHERE e.disputeId = :disputeId AND e.level = :level AND e.notifiedAt >= :since
            """)
    boolean existsRecent(@Param("disputeId") UUID disputeId, @Param("level") int level, @Param("since") OffsetDateTime since);
}
