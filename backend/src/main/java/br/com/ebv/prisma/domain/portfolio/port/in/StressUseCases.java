package br.com.ebv.prisma.domain.portfolio.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class StressUseCases {
    private StressUseCases() {}

    public interface RunStressUseCase {
        record Command(UUID portfolioId, Map<String, Object> variables, boolean compareBaseline) {}
        record Result(String runId, String status, long elapsedMs, String aggregateVersion,
                      BigDecimal baselineNpl, BigDecimal stressedNpl, BigDecimal expectedLossDelta, boolean queued) {}
        Result execute(Command command);
    }

    public interface ListStressScenariosUseCase {
        record Scenario(String code, String kind, String label, Map<String, Object> variables) {}
        record Result(List<Scenario> scenarios) {}
        Result execute();
    }

    public interface GetStressRunUseCase {
        record Result(String runId, String status, UUID portfolioId, String aggregateVersion,
                      BigDecimal baselineNpl, BigDecimal stressedNpl, BigDecimal expectedLossDelta) {}
        Result execute(String runId);
    }
}
