package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CoachSimulationJpaRepository extends JpaRepository<CoachSimulationEntity, UUID> {
    List<CoachSimulationEntity> findByDocumentoHashOrderByCreatedAtDesc(String documentoHash);
}
