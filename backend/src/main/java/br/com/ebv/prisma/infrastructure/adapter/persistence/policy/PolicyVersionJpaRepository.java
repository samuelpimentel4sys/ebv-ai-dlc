package br.com.ebv.prisma.infrastructure.adapter.persistence.policy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface PolicyVersionJpaRepository extends JpaRepository<PolicyVersionEntity, UUID> {

    @Query("""
            SELECT p FROM PolicyVersionEntity p
            WHERE (:status IS NULL OR p.status = :status)
              AND (:author IS NULL OR p.author = :author)
              AND (:fromTs IS NULL OR p.createdAt >= :fromTs)
              AND (:toTs IS NULL OR p.createdAt <= :toTs)
            ORDER BY p.createdAt DESC
            """)
    List<PolicyVersionEntity> search(
            @Param("status") String status,
            @Param("author") String author,
            @Param("fromTs") OffsetDateTime fromTs,
            @Param("toTs") OffsetDateTime toTs
    );
}
