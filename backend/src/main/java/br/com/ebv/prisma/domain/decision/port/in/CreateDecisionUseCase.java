package br.com.ebv.prisma.domain.decision.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CreateDecisionUseCase {

    record Command(
            String documento,
            String productCode,
            boolean includeExplanation,
            int budgetMs,
            String clientId
    ) {}

    record Result(
            UUID decisionId,
            BigDecimal score,
            String outcome,
            String modelVersion,
            int latencyMs,
            boolean partial,
            List<String> degradedFlags,
            String explanationRef
    ) {}

    Result execute(Command cmd);
}
