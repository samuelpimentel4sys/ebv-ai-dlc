package br.com.ebv.prisma.infrastructure.adapter.persistence.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface ReviewJpaRepository extends JpaRepository<ReviewEntity, UUID> {

    @Query("""
            SELECT r FROM ReviewEntity r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:assignee IS NULL OR r.assignee = :assignee)
              AND (:dueBefore IS NULL OR r.dueAt <= :dueBefore)
            ORDER BY r.dueAt ASC
            """)
    List<ReviewEntity> search(
            @Param("status") String status,
            @Param("assignee") String assignee,
            @Param("dueBefore") OffsetDateTime dueBefore
    );
}
