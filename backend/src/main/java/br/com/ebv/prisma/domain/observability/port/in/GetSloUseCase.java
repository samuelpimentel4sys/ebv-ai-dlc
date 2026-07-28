package br.com.ebv.prisma.domain.observability.port.in;

import java.math.BigDecimal;

public interface GetSloUseCase {

    record SloResult(
            String window,
            String clientId,
            int targetP95Ms,
            BigDecimal p95Ms,
            BigDecimal p99Ms,
            boolean compliance,
            BigDecimal errorBudgetRemainingPct
    ) {}

    SloResult execute(String window, String clientId);
}
