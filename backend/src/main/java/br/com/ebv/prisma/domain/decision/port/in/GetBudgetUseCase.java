package br.com.ebv.prisma.domain.decision.port.in;

import java.util.Map;

public interface GetBudgetUseCase {

    record BudgetInfo(
            int defaultBudgetMs,
            Map<String, Integer> slices
    ) {}

    BudgetInfo execute();
}
