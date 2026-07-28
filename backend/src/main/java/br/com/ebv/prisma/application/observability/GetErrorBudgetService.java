package br.com.ebv.prisma.application.observability;

import br.com.ebv.prisma.domain.observability.port.in.GetErrorBudgetUseCase;
import br.com.ebv.prisma.domain.observability.port.out.ObservabilityRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class GetErrorBudgetService implements GetErrorBudgetUseCase {

    private final ObservabilityRepositoryPort observabilityRepo;

    public GetErrorBudgetService(ObservabilityRepositoryPort observabilityRepo) {
        this.observabilityRepo = observabilityRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public BudgetResult execute(String clientId) {
        Instant to = Instant.now();
        Instant from = to.minus(24, ChronoUnit.HOURS);
        String filter = clientId == null || clientId.isBlank() ? null : clientId;

        List<Integer> latencies = observabilityRepo.findLatencies(from, to, filter).stream()
                .map(ObservabilityRepositoryPort.LatencySample::latencyMs)
                .toList();

        BigDecimal remaining = SloAggregator.errorBudgetRemainingPct(latencies);
        boolean alert = SloAggregator.burnAlert(remaining);
        return new BudgetResult(remaining, alert);
    }
}
