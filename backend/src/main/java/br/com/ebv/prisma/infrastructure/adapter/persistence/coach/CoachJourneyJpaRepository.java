package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CoachJourneyJpaRepository extends JpaRepository<CoachJourneyEntity, UUID> {
    Optional<CoachJourneyEntity> findFirstByDocumentoHashAndStatus(String documentoHash, String status);
}
