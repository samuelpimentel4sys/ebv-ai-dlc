package br.com.ebv.prisma.infrastructure.adapter.persistence.fairness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface FairnessMetricJpaRepository extends JpaRepository<FairnessMetricEntity, UUID> {

    @Query("""
            SELECT m FROM FairnessMetricEntity m
            WHERE (:modelVersion IS NULL OR m.modelVersion = :modelVersion)
              AND (:metric IS NULL OR m.metricName = :metric)
              AND (:segment IS NULL OR m.segmentName = :segment)
            ORDER BY m.createdAt DESC
            """)
    List<FairnessMetricEntity> search(
            @Param("modelVersion") String modelVersion,
            @Param("metric") String metric,
            @Param("segment") String segment
    );
}
