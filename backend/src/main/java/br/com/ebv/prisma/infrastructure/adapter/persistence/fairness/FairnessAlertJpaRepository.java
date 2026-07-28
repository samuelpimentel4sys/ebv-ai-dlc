package br.com.ebv.prisma.infrastructure.adapter.persistence.fairness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FairnessAlertJpaRepository extends JpaRepository<FairnessAlertEntity, UUID> {

    @Query("""
            SELECT a FROM FairnessAlertEntity a
            WHERE (:severity IS NULL OR a.severity = :severity)
              AND (:status IS NULL OR a.status = :status)
              AND (:modelVersion IS NULL OR a.modelVersion = :modelVersion)
            ORDER BY a.openedAt DESC
            """)
    List<FairnessAlertEntity> search(
            @Param("severity") String severity,
            @Param("status") String status,
            @Param("modelVersion") String modelVersion
    );
}
