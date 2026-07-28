package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MissionEnrollmentJpaRepository extends JpaRepository<MissionEnrollmentEntity, UUID> {
    Optional<MissionEnrollmentEntity> findByMissionIdAndDocumentoHash(UUID missionId, String documentoHash);
}
