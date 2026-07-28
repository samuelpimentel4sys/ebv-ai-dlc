package br.com.ebv.prisma.infrastructure.adapter.persistence.dossier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DossierJpaRepository extends JpaRepository<DossierEntity, UUID> {
}
