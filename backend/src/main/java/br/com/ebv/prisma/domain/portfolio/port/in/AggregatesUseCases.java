package br.com.ebv.prisma.domain.portfolio.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class AggregatesUseCases {
    private AggregatesUseCases() {}

    public interface GetAggregatesUseCase {
        record Query(UUID portfolioId) {}
        record Cube(String cubeName, Instant lastRefreshAt, String status, int ageMinutes) {}
        record Result(UUID portfolioId, List<Cube> cubes, String aggregateVersion) {}
        Result execute(Query query);
    }

    public interface RefreshAggregatesUseCase {
        record Command(String cubeName, String mode, List<String> partitions) {}
        record Result(String jobId, String status, String mode) {}
        Result execute(Command command);
    }

    public interface GetFreshnessUseCase {
        record CubeFreshness(String cubeName, int ageMinutes, int slaMinutes, boolean withinSla, String status) {}
        record Result(List<CubeFreshness> cubes) {}
        Result execute();
    }
}
