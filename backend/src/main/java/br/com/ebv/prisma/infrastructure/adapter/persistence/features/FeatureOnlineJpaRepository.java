package br.com.ebv.prisma.infrastructure.adapter.persistence.features;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface FeatureOnlineJpaRepository extends JpaRepository<FeatureOnlineEntity, FeatureOnlineEntity.Pk> {

    @Query("""
        select f from FeatureOnlineEntity f
        where f.documento = :doc and f.featureName = :name and f.eventTs <= :asOf
        order by f.eventTs desc
        """)
    List<FeatureOnlineEntity> findAsOfCandidates(
            @Param("doc") String documento,
            @Param("name") String featureName,
            @Param("asOf") OffsetDateTime asOf
    );

    default Optional<FeatureOnlineEntity> findLatestAsOf(String documento, String featureName, OffsetDateTime asOf) {
        return findAsOfCandidates(documento, featureName, asOf).stream().findFirst();
    }
}
