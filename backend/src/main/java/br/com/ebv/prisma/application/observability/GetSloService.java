package br.com.ebv.prisma.application.observability;

import br.com.ebv.prisma.domain.observability.port.in.GetSloUseCase;
import br.com.ebv.prisma.domain.observability.port.out.ObservabilityRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class GetSloService implements GetSloUseCase {

    private final ObservabilityRepositoryPort observabilityRepo;

    public GetSloService(ObservabilityRepositoryPort observabilityRepo) {
        this.observabilityRepo = observabilityRepo;
    }

    @Override
    @Transactional
    public SloResult execute(String window, String clientId) {
        String win = window == null || window.isBlank() ? "1h" : window.trim().toLowerCase(Locale.ROOT);
        Instant to = Instant.now();
        Instant from = to.minus(parseWindow(win));

        List<Integer> latencies = observabilityRepo.findLatencies(from, to, blankToNull(clientId)).stream()
                .map(ObservabilityRepositoryPort.LatencySample::latencyMs)
                .toList();
        List<Integer> sorted = SloAggregator.sortedCopy(latencies);

        BigDecimal p95 = SloAggregator.percentile(sorted, 0.95);
        BigDecimal p99 = SloAggregator.percentile(sorted, 0.99);
        BigDecimal remaining = SloAggregator.errorBudgetRemainingPct(latencies);
        boolean compliance = p95.compareTo(BigDecimal.valueOf(SloAggregator.TARGET_P95_MS)) <= 0;

        observabilityRepo.saveSloSnapshot(new ObservabilityRepositoryPort.SloSnapshotRecord(
                to,
                blankToNull(clientId),
                p95,
                p99,
                BigDecimal.ZERO,
                remaining
        ));

        return new SloResult(
                win,
                blankToNull(clientId),
                SloAggregator.TARGET_P95_MS,
                p95,
                p99,
                compliance,
                remaining
        );
    }

    static Duration parseWindow(String window) {
        return switch (window) {
            case "1h" -> Duration.ofHours(1);
            case "24h" -> Duration.ofHours(24);
            case "7d" -> Duration.ofDays(7);
            default -> throw new IllegalArgumentException("window inválida (use 1h, 24h, 7d): " + window);
        };
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
