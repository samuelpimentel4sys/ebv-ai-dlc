package br.com.ebv.prisma.domain.explain.port.in;

import java.util.List;
import java.util.UUID;

public interface GetExplainFactorsUseCase {

    Result execute(UUID decisionId, String direction, int limit);

    record Result(
            UUID decisionId,
            String direction,
            int limit,
            List<GetExplanationUseCase.Factor> items
    ) {}
}
