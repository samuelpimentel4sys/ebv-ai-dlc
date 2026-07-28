package br.com.ebv.prisma.domain.portfolio.port.out;

import java.util.List;

/**
 * Grafo de carteira (Neo4j lab / Neptune futuro).
 */
public interface PortfolioGraphStorePort {

    boolean live();

    GraphSnapshot loadGraph(int maxNodes);

    void ensureLabSeed();

    record GraphSnapshot(List<Node> nodes, List<Edge> edges, boolean truncated) {}

    record Node(
            String id,
            double exposure,
            String rating,
            int score,
            double x,
            double y,
            double risk
    ) {}

    record Edge(String from, String to, double weight, String type) {}
}
