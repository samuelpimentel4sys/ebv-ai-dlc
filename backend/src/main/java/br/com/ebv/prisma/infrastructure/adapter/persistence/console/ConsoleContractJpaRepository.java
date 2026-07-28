package br.com.ebv.prisma.infrastructure.adapter.persistence.console;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsoleContractJpaRepository extends JpaRepository<ConsoleContractEntity, UUID> {
    List<ConsoleContractEntity> findByTenantId(String tenantId);
}
