package br.com.ebv.prisma.domain.explain.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface GetExplanationUseCase {

    Result execute(UUID decisionId, boolean includeLabels);

    record Factor(
            String attributeCode,
            String businessLabel,
            Object value,
            BigDecimal shapValue,
            String direction
    ) {}

    record Result(
            UUID decisionId,
            String modelVersion,
            String policyVersion,
            BigDecimal baseValue,
            BigDecimal score,
            String snapshotHash,
            List<Factor> factors,
            Instant generatedAt
    ) {}
}
