package br.com.ebv.prisma.infrastructure.adapter.persistence.console;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsoleInvoiceJpaRepository extends JpaRepository<ConsoleInvoiceEntity, UUID> {
    List<ConsoleInvoiceEntity> findByTenantId(String tenantId);
}
