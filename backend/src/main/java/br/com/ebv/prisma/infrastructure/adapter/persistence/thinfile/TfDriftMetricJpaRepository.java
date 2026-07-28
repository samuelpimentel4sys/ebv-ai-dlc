package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TfDriftMetricJpaRepository extends JpaRepository<TfDriftMetricEntity, UUID> {
    List<TfDriftMetricEntity> findByRunId(UUID runId);
}
