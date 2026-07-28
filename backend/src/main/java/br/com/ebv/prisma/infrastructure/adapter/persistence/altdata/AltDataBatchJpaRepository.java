package br.com.ebv.prisma.infrastructure.adapter.persistence.altdata;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AltDataBatchJpaRepository extends JpaRepository<AltDataBatchEntity, UUID> {
    List<AltDataBatchEntity> findTop20ByOrderByReceivedAtDesc();
}
