package br.com.ebv.prisma.domain.identity.port.in;

import br.com.ebv.prisma.domain.identity.model.GoldenRecord;
import br.com.ebv.prisma.domain.identity.model.GoldenRecordId;

import java.math.BigDecimal;
import java.util.UUID;

public interface MergeIdentityUseCase {

    record MergeCommand(
            GoldenRecordId survivorGrId,
            GoldenRecordId mergedGrId,
            BigDecimal confidence,
            String reason,
            UUID actorId
    ) {}

    GoldenRecord execute(MergeCommand command);
}
