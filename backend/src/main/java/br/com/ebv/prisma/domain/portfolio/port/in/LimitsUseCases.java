package br.com.ebv.prisma.domain.portfolio.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class LimitsUseCases {
    private LimitsUseCases() {}

    public interface GetConcentrationUseCase {
        record Query(UUID portfolioId) {}
        record DimensionRow(String dimension, String key, BigDecimal currentPct,
                            BigDecimal thresholdPct, BigDecimal warnPct, String status) {}
        record Result(UUID portfolioId, List<DimensionRow> dimensions) {}
        Result execute(Query query);
    }

    public interface UpsertLimitUseCase {
        record Command(UUID portfolioId, String dimension, BigDecimal thresholdPct, BigDecimal warnPct) {}
        record Result(UUID limitId, UUID portfolioId, String dimension,
                      BigDecimal thresholdPct, BigDecimal warnPct) {}
        Result execute(Command command);
    }

    public interface ListAlertsUseCase {
        record Query(UUID portfolioId, String status) {}
        record Alert(String alertId, String dimension, String key, String severity, String status, String message) {}
        record Result(UUID portfolioId, List<Alert> alerts) {}
        Result execute(Query query);
    }
}
