package br.com.ebv.prisma.domain.dossier.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface GetDossierUseCase {

    Result execute(UUID dossierId);

    record Result(
            UUID dossierId,
            UUID decisionId,
            String status,
            String purpose,
            String legalBasis,
            String snapshotHash,
            String documentHash,
            List<String> formats,
            Instant issuedAt
    ) {}
}
