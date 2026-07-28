package br.com.ebv.prisma.infrastructure.adapter.persistence.analytics;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SacMetricJpaRepository extends JpaRepository<SacMetricEntity, UUID> {
    List<SacMetricEntity> findByMetricKeyOrderByPeriodToDesc(String metricKey);

    Optional<SacMetricEntity> findFirstByMetricKeyOrderByPeriodToDesc(String metricKey);
}
