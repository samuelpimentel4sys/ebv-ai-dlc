package br.com.ebv.prisma.domain.portfolio.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class CommunitiesUseCases {
    private CommunitiesUseCases() {}

    public interface DetectCommunitiesUseCase {
        record Command(UUID portfolioId, int minCommunitySize, String algorithm) {}
        record Result(String runId, String status) {}
        Result execute(Command command);
    }

    public interface ListCommunitiesUseCase {
        record Query(UUID portfolioId) {}
        record Community(String communityId, String label, BigDecimal totalExposure, int memberCount) {}
        record Result(UUID portfolioId, List<Community> communities) {}
        Result execute(Query query);
    }

    public interface GetCommunityUseCase {
        record Result(String communityId, String label, BigDecimal totalExposure,
                      int memberCount, List<String> members) {}
        Result execute(String communityId);
    }
}
