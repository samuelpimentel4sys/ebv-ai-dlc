package br.com.ebv.prisma.domain.identity.port.in;

import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;
import br.com.ebv.prisma.domain.identity.service.SimilarityBandService;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/** Avalia pareamento (Splink score) → auto-merge / fila / discard. */
public interface EvaluatePairingUseCase {

    record PairingCommand(
            GoldenRecordId leftGrId,
            GoldenRecordId rightGrId,
            BigDecimal confidence,
            UUID actorId
    ) {}

    record PairingResult(
            SimilarityBandService.Band band,
            Optional<GoldenRecord> mergedSurvivor,
            Optional<UUID> candidateId
    ) {}

    PairingResult execute(PairingCommand command);
}
