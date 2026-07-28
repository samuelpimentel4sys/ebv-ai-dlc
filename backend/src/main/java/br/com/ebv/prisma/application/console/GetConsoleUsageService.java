package br.com.ebv.prisma.application.console;

import br.com.ebv.prisma.domain.console.port.in.GetConsoleUsageUseCase;
import br.com.ebv.prisma.domain.console.port.out.ConsoleRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class GetConsoleUsageService implements GetConsoleUsageUseCase {

    private final ConsoleRepositoryPort consoleRepo;

    public GetConsoleUsageService(ConsoleRepositoryPort consoleRepo) {
        this.consoleRepo = consoleRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        String tenantId = (query.tenantId() == null || query.tenantId().isBlank())
                ? "demo-tenant" : query.tenantId().trim();
        List<ConsoleRepositoryPort.UsageRecord> rows = consoleRepo.findUsageByTenant(tenantId);
        List<UsageItem> items = rows.stream()
                .map(r -> new UsageItem(r.productCode(), r.environment(), r.callCount(), r.amount(), r.currency()))
                .toList();
        long calls = rows.stream().mapToLong(ConsoleRepositoryPort.UsageRecord::callCount).sum();
        BigDecimal amount = rows.stream()
                .map(ConsoleRepositoryPort.UsageRecord::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Instant freshness = rows.stream()
                .map(ConsoleRepositoryPort.UsageRecord::freshnessAt)
                .max(Comparator.naturalOrder())
                .orElse(Instant.now());
        return new Result(tenantId, freshness, items, new Totals(calls, amount));
    }
}
