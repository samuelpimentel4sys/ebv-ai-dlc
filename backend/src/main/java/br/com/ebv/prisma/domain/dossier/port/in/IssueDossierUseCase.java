package br.com.ebv.prisma.domain.dossier.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface IssueDossierUseCase {

    Result execute(Command command);

    record Command(
            UUID decisionId,
            String purpose,
            String legalBasis,
            List<String> formats,
            String actorId
    ) {}

    record Result(
            UUID dossierId,
            UUID decisionId,
            String status,
            String snapshotHash,
            String documentHash,
            List<String> formats,
            long durationMs,
            Instant issuedAt
    ) {}
}
