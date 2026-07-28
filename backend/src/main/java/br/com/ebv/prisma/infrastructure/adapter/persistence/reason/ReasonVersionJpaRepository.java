package br.com.ebv.prisma.infrastructure.adapter.persistence.reason;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReasonVersionJpaRepository extends JpaRepository<ReasonVersionEntity, UUID> {

    @Query("SELECT MAX(r.version) FROM ReasonVersionEntity r WHERE r.code = :code")
    Optional<Integer> findMaxVersion(@Param("code") String code);

    @Query("""
            SELECT r FROM ReasonVersionEntity r
            WHERE (:status IS NULL OR r.status = :status)
            ORDER BY r.createdAt DESC
            """)
    List<ReasonVersionEntity> searchByStatus(@Param("status") String status);

    @Query("""
            SELECT r FROM ReasonVersionEntity r
            WHERE r.status = 'APPROVED'
            ORDER BY r.code ASC, r.version DESC
            """)
    List<ReasonVersionEntity> findAllApproved();
}
