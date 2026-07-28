package br.com.ebv.prisma.domain.portfolio.port.in;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class GraphUseCases {
    private GraphUseCases() {}

    public interface GetGraphUseCase {
        record Query(UUID portfolioId, int lod, int maxNodes) {}
        record Node(String id, double exposure, String riskBand, int score, double x, double y, double z) {}
        record Edge(String source, String target, double weight, String relationType) {}
        record Result(UUID portfolioId, int lod, int nodeCount, int edgeCount, String aggregateVersion,
                      long latencyMs, List<Node> nodes, List<Edge> edges, boolean truncated) {}
        Result execute(Query query);
    }

    public interface GetGraphNodeUseCase {
        record Query(UUID portfolioId, String nodeId) {}
        record Neighbor(String id, String relationType, double weight) {}
        record Result(String nodeId, double exposure, String riskBand, int score, List<Neighbor> neighbors) {}
        Result execute(Query query);
    }

    public interface FilterGraphUseCase {
        record Command(UUID portfolioId, int lod, int maxNodes, Map<String, Object> criteria) {}
        record Result(UUID filterId, UUID portfolioId, int lod, int maxNodes, int nodeCount, boolean truncated) {}
        Result execute(Command command);
    }

    public interface GetProjection2dUseCase {
        record Query(UUID portfolioId, String filterId) {}
        record Node2d(String id, double x, double y, double exposure, String riskBand, int score, String label) {}
        record Edge2d(String source, String target, double weight) {}
        record Result(List<Node2d> nodes, List<Edge2d> edges, boolean parityWith3d) {}
        Result execute(Query query);
    }

    public interface GetTabularUseCase {
        record Query(UUID portfolioId, String filterId) {}
        record Row(String id, String label, double exposure, String riskBand, int score, int degree) {}
        record Result(List<Row> rows, int total) {}
        Result execute(Query query);
    }
}
