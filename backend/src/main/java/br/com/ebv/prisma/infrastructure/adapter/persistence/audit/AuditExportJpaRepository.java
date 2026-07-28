package br.com.ebv.prisma.infrastructure.adapter.persistence.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditExportJpaRepository extends JpaRepository<AuditExportEntity, UUID> {
}
