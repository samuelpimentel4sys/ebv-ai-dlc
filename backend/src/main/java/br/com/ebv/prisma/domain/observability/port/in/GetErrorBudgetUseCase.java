package br.com.ebv.prisma.domain.observability.port.in;

import java.math.BigDecimal;

public interface GetErrorBudgetUseCase {

    record BudgetResult(
            BigDecimal errorBudgetRemainingPct,
            boolean burnAlert
    ) {}

    /** Window fixa 24h — RN002 queima error budget. */
    BudgetResult execute(String clientId);
}
