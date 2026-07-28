package br.com.ebv.prisma.domain.portfolio.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class ContagionUseCases {
    private ContagionUseCases() {}

    public interface SimulateContagionUseCase {
        record Command(UUID portfolioId, String originNodeId, BigDecimal transmissionFactor,
                       int maxWaves, List<String> relationTypes) {}
        record Result(String simId, String status, String pollUrl) {}
        Result execute(Command command);
    }

    public interface GetContagionUseCase {
        record Wave(int wave, BigDecimal expectedLoss, int nodesDefaulted) {}
        record Result(String simId, String status, UUID portfolioId, String originNodeId,
                      List<Wave> waves, BigDecimal totalExpectedLoss) {}
        Result execute(String simId);
    }

    public interface GetCriticalNodesUseCase {
        record Query(UUID portfolioId, int limit) {}
        record CriticalNode(String nodeId, double systemicScore, BigDecimal exposure, int outDegree) {}
        record Result(UUID portfolioId, List<CriticalNode> nodes) {}
        Result execute(Query query);
    }
}
