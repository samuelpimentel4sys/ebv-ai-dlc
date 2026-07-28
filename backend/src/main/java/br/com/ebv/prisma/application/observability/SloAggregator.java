package br.com.ebv.prisma.application.observability;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Agregação SLO lab — p95/p99 por percentil nearest-rank;
 * error budget restante = % decisões com latency_ms &lt;= targetP95Ms (stub documentado).
 */
public final class SloAggregator {

    public static final int TARGET_P95_MS = 250;

    private SloAggregator() {}

    public static BigDecimal percentile(List<Integer> sortedAsc, double p) {
        if (sortedAsc == null || sortedAsc.isEmpty()) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }
        int n = sortedAsc.size();
        int rank = (int) Math.ceil(p * n);
        int idx = Math.min(n - 1, Math.max(0, rank - 1));
        return BigDecimal.valueOf(sortedAsc.get(idx)).setScale(1, RoundingMode.HALF_UP);
    }

    /**
     * Stub formula: remainingPct = (compliantCount / total) * 100.
     * Compliant = latency_ms &lt;= {@link #TARGET_P95_MS}.
     * Empty sample → 100% remaining (sem burn).
     */
    public static BigDecimal errorBudgetRemainingPct(List<Integer> latenciesMs) {
        if (latenciesMs == null || latenciesMs.isEmpty()) {
            return new BigDecimal("100.0");
        }
        long compliant = latenciesMs.stream().filter(ms -> ms != null && ms <= TARGET_P95_MS).count();
        return BigDecimal.valueOf(compliant)
                .multiply(new BigDecimal("100"))
                .divide(BigDecimal.valueOf(latenciesMs.size()), 1, RoundingMode.HALF_UP);
    }

    /** CA-06 / RN002: alerta se queima &gt; 50% do budget (remaining &lt; 50). */
    public static boolean burnAlert(BigDecimal remainingPct) {
        return remainingPct.compareTo(new BigDecimal("50")) < 0;
    }

    public static List<Integer> sortedCopy(List<Integer> raw) {
        List<Integer> copy = new ArrayList<>(raw == null ? List.of() : raw);
        Collections.sort(copy);
        return copy;
    }
}
