package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MissionCatalogJpaRepository extends JpaRepository<MissionCatalogEntity, UUID> {
    List<MissionCatalogEntity> findByActiveTrue();
}
