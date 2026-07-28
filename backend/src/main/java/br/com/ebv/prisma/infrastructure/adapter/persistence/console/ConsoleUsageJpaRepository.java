package br.com.ebv.prisma.infrastructure.adapter.persistence.console;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsoleUsageJpaRepository extends JpaRepository<ConsoleUsageEntity, UUID> {
    List<ConsoleUsageEntity> findByTenantId(String tenantId);
}
