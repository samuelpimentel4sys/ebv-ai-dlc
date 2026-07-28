package br.com.ebv.prisma.domain.console.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface GetConsoleUsageUseCase {

    record Query(String tenantId) {}

    record UsageItem(String productCode, String environment, long callCount, BigDecimal amount, String currency) {}

    record Totals(long callCount, BigDecimal amount) {}

    record Result(String tenantId, Instant dataFreshnessAt, List<UsageItem> items, Totals totals) {}

    Result execute(Query query);
}
