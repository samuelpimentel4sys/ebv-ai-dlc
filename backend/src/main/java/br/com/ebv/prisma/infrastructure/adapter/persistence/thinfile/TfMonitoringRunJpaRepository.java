package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TfMonitoringRunJpaRepository extends JpaRepository<TfMonitoringRunEntity, UUID> {
    List<TfMonitoringRunEntity> findAllByOrderByStartedAtDesc();
    Optional<TfMonitoringRunEntity> findFirstByOrderByStartedAtDesc();
}
