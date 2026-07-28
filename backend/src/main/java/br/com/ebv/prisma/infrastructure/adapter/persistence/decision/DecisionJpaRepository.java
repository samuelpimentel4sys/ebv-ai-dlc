package br.com.ebv.prisma.infrastructure.adapter.persistence.decision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface DecisionJpaRepository extends JpaRepository<DecisionEntity, UUID>, JpaSpecificationExecutor<DecisionEntity> {

    @Query(value = """
            SELECT * FROM tb_decision
            WHERE documento = :documento
            ORDER BY created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<DecisionEntity> findLatestByDocumento(@Param("documento") String documento);

    Optional<DecisionEntity> findBySha256(String sha256);

    @Query(value = """
            SELECT * FROM tb_decision
            WHERE documento = :documento AND created_at < :before
            ORDER BY created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<DecisionEntity> findPreviousByDocumento(
            @Param("documento") String documento,
            @Param("before") OffsetDateTime before
    );
}
