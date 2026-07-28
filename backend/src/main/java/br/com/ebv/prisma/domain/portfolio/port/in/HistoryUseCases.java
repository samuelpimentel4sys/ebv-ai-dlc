package br.com.ebv.prisma.domain.portfolio.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class HistoryUseCases {
    private HistoryUseCases() {}

    public interface GetSnapshotUseCase {
        record Query(UUID portfolioId, LocalDate date) {}
        record Result(LocalDate asOfDate, String aggregateVersion, int nodeCount,
                      boolean divergenceFlag, Map<String, Object> summary) {}
        Result execute(Query query);
    }

    public interface CompareSnapshotsUseCase {
        record Command(UUID portfolioId, LocalDate dateA, LocalDate dateB) {}
        record Result(LocalDate dateA, LocalDate dateB, BigDecimal exposureDelta,
                      BigDecimal nplDelta, Map<String, Object> details) {}
        Result execute(Command command);
    }

    public interface GetTimelineUseCase {
        record Query(UUID portfolioId) {}
        record Event(String eventId, Instant eventAt, String eventType, String label) {}
        record Result(UUID portfolioId, List<Event> events) {}
        Result execute(Query query);
    }
}
