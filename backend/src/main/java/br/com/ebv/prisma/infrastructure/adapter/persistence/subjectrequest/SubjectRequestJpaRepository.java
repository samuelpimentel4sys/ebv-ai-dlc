package br.com.ebv.prisma.infrastructure.adapter.persistence.subjectrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface SubjectRequestJpaRepository extends JpaRepository<SubjectRequestEntity, UUID> {

    @Query("""
            SELECT s FROM SubjectRequestEntity s
            WHERE (:rightType IS NULL OR s.rightType = :rightType)
              AND (:status IS NULL OR s.status = :status)
              AND (:dueBefore IS NULL OR s.dueAt <= :dueBefore)
            ORDER BY s.dueAt ASC
            """)
    List<SubjectRequestEntity> search(
            @Param("rightType") String rightType,
            @Param("status") String status,
            @Param("dueBefore") OffsetDateTime dueBefore
    );
}
