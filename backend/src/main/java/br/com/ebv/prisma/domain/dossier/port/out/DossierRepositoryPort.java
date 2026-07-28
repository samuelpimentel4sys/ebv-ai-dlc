package br.com.ebv.prisma.domain.dossier.port.out;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface DossierRepositoryPort {

    record DossierRecord(
            UUID id,
            UUID decisionId,
            String purpose,
            String legalBasis,
            String status,
            String formatsJson,
            String artifactJson,
            String artifactPdfUri,
            String manifestHash,
            Instant createdAt
    ) {}

    void save(DossierRecord record);

    Optional<DossierRecord> findById(UUID id);
}
