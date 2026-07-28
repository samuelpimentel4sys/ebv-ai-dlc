package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoldenRecordJpaRepository extends JpaRepository<GoldenRecordEntity, UUID> {

    @Query("""
        select g from GoldenRecordEntity g
        where trim(g.canonicalDocumento) = :doc and g.status = 'ACTIVE'
        order by g.version desc
        """)
    List<GoldenRecordEntity> findActiveByDocumento(@Param("doc") String documento);

    default Optional<GoldenRecordEntity> findLatestActiveByDocumento(String documento) {
        List<GoldenRecordEntity> list = findActiveByDocumento(documento);
        return list.stream().findFirst();
    }
}
