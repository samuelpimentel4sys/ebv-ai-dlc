package br.com.ebv.prisma.infrastructure.adapter.persistence.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditEventJpaRepository extends JpaRepository<AuditEventEntity, UUID> {

    @Query(value = "SELECT sha256 FROM tb_audit_event ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<String> findLatestSha256();

    @Query("""
            SELECT e FROM AuditEventEntity e
            WHERE (:documento IS NULL OR e.documento = :documento)
              AND (:actorId IS NULL OR e.actorId = :actorId)
              AND (:eventType IS NULL OR e.eventType = :eventType)
              AND (:fromTs IS NULL OR e.createdAt >= :fromTs)
              AND (:toTs IS NULL OR e.createdAt <= :toTs)
            ORDER BY e.createdAt DESC
            """)
    List<AuditEventEntity> search(
            @Param("documento") String documento,
            @Param("actorId") String actorId,
            @Param("eventType") String eventType,
            @Param("fromTs") OffsetDateTime fromTs,
            @Param("toTs") OffsetDateTime toTs
    );
}
