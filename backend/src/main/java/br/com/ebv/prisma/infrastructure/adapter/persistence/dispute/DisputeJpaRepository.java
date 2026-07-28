package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisputeJpaRepository extends JpaRepository<DisputeEntity, UUID> {

    Optional<DisputeEntity> findByProtocol(String protocol);

    @Query("""
            SELECT d FROM DisputeEntity d
            WHERE d.status IN ('OPEN', 'IN_DILIGENCE')
            ORDER BY d.dueAt ASC
            """)
    List<DisputeEntity> findQueueOrderedByDueAt();
}
