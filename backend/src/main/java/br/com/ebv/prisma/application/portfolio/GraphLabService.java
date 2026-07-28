package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.FilterGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphNodeUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetProjection2dUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetTabularUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioGraphStorePort;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GraphLabService implements GetGraphUseCase, GetGraphNodeUseCase, FilterGraphUseCase,
        GetProjection2dUseCase, GetTabularUseCase {

    private static final int HARD_MAX_NODES = 100_000;
    private final PortfolioRepositoryPort repo;
    private final PortfolioGraphStorePort graphStore;
    private final ObjectMapper mapper;

    public GraphLabService(
            PortfolioRepositoryPort repo,
            PortfolioGraphStorePort graphStore,
            ObjectMapper mapper
    ) {
        this.repo = repo;
        this.graphStore = graphStore;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public GetGraphUseCase.Result execute(GetGraphUseCase.Query query) {
        requirePortfolio(query.portfolioId());
        int lod = query.lod() <= 0 ? 2 : query.lod();
        int max = query.maxNodes() <= 0 ? 50_000 : query.maxNodes();
        if (max > HARD_MAX_NODES) {
            throw new PortfolioValidationException("maxNodes acima do limite " + HARD_MAX_NODES + "; aplique filtros");
        }
        long t0 = System.currentTimeMillis();

        List<GetGraphUseCase.Node> nodes;
        List<GetGraphUseCase.Edge> edges;
        boolean truncated;
        String aggVersion;

        if (graphStore.live()) {
            var snap = graphStore.loadGraph(max);
            nodes = snap.nodes().stream()
                    .map(n -> new GetGraphUseCase.Node(
                            n.id(), n.exposure(), n.rating(), n.score(), n.x(), n.y(), n.risk()))
                    .toList();
            edges = snap.edges().stream()
                    .map(e -> new GetGraphUseCase.Edge(e.from(), e.to(), e.weight(), e.type()))
                    .toList();
            truncated = snap.truncated();
            aggVersion = "neo4j-" + Instant.now();
        } else {
            nodes = List.of(
                    new GetGraphUseCase.Node("n-1001", 1_250_000.50, "C", 612, 0.12, 0.44, 0.08),
                    new GetGraphUseCase.Node("n-2044", 890_000.00, "B", 701, 0.33, 0.21, 0.15)
            );
            edges = List.of(new GetGraphUseCase.Edge("n-1001", "n-2044", 0.37, "FORNECEDOR"));
            truncated = max < nodes.size();
            if (truncated) {
                nodes = nodes.subList(0, Math.max(1, max));
            }
            aggVersion = "agg-lab-" + Instant.now();
        }

        return new GetGraphUseCase.Result(
                query.portfolioId(), lod, nodes.size(), edges.size(),
                aggVersion, System.currentTimeMillis() - t0,
                nodes, edges, truncated
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GetGraphNodeUseCase.Result execute(GetGraphNodeUseCase.Query query) {
        requirePortfolio(query.portfolioId());
        if (query.nodeId() == null || query.nodeId().isBlank()) {
            throw new PortfolioValidationException("nodeId obrigatório");
        }
        if ("missing".equalsIgnoreCase(query.nodeId())) {
            throw new PortfolioNotFoundException("Nó não encontrado: " + query.nodeId());
        }
        if (graphStore.live()) {
            var snap = graphStore.loadGraph(HARD_MAX_NODES);
            var node = snap.nodes().stream()
                    .filter(n -> n.id().equals(query.nodeId()))
                    .findFirst()
                    .orElseThrow(() -> new PortfolioNotFoundException("Nó não encontrado: " + query.nodeId()));
            var neighbors = snap.edges().stream()
                    .filter(e -> e.from().equals(node.id()) || e.to().equals(node.id()))
                    .map(e -> {
                        String other = e.from().equals(node.id()) ? e.to() : e.from();
                        return new GetGraphNodeUseCase.Neighbor(other, e.type(), e.weight());
                    })
                    .toList();
            return new GetGraphNodeUseCase.Result(
                    node.id(), node.exposure(), node.rating(), node.score(), neighbors);
        }
        return new GetGraphNodeUseCase.Result(
                query.nodeId(), 1_250_000.50, "C", 612,
                List.of(new GetGraphNodeUseCase.Neighbor("n-2044", "FORNECEDOR", 0.37))
        );
    }

    @Override
    @Transactional
    public FilterGraphUseCase.Result execute(FilterGraphUseCase.Command command) {
        requirePortfolio(command.portfolioId());
        int max = command.maxNodes() <= 0 ? 50_000 : command.maxNodes();
        if (max > HARD_MAX_NODES) {
            throw new PortfolioValidationException("maxNodes acima do limite; aplique filtros");
        }
        UUID filterId = UUID.randomUUID();
        String criteria;
        try {
            criteria = mapper.writeValueAsString(command.criteria() == null ? Map.of() : command.criteria());
        } catch (Exception e) {
            throw new PortfolioValidationException("criteria inválido");
        }
        int lod = command.lod() <= 0 ? 2 : command.lod();
        repo.saveGraphFilter(new PortfolioRepositoryPort.GraphFilterRecord(
                filterId, command.portfolioId(), lod, max, criteria, Instant.now()));
        int matched = graphStore.live() ? graphStore.loadGraph(max).nodes().size() : 2;
        return new FilterGraphUseCase.Result(filterId, command.portfolioId(), lod, max, matched, false);
    }

    @Override
    @Transactional(readOnly = true)
    public GetProjection2dUseCase.Result execute(GetProjection2dUseCase.Query query) {
        requirePortfolio(query.portfolioId());
        if (graphStore.live()) {
            var snap = graphStore.loadGraph(5_000);
            var nodes2d = snap.nodes().stream()
                    .map(n -> new GetProjection2dUseCase.Node2d(
                            n.id(), n.x(), n.y(), n.exposure(), n.rating(), n.score(), n.id()))
                    .toList();
            var edges2d = snap.edges().stream()
                    .map(e -> new GetProjection2dUseCase.Edge2d(e.from(), e.to(), e.weight()))
                    .toList();
            return new GetProjection2dUseCase.Result(nodes2d, edges2d, true);
        }
        return new GetProjection2dUseCase.Result(
                List.of(new GetProjection2dUseCase.Node2d("n-1", 0.2, 0.7, 1000, "B", 700, "CNPJ lab")),
                List.of(),
                true
        );
    }

    @Override
    @Transactional(readOnly = true)
    public GetTabularUseCase.Result execute(GetTabularUseCase.Query query) {
        requirePortfolio(query.portfolioId());
        if (graphStore.live()) {
            var snap = graphStore.loadGraph(500);
            var rows = snap.nodes().stream()
                    .map(n -> {
                        int degree = (int) snap.edges().stream()
                                .filter(e -> e.from().equals(n.id()) || e.to().equals(n.id()))
                                .count();
                        return new GetTabularUseCase.Row(
                                n.id(), n.id(), n.exposure(), n.rating(), n.score(), degree);
                    })
                    .toList();
            return new GetTabularUseCase.Result(rows, rows.size());
        }
        var rows = List.of(new GetTabularUseCase.Row("n-1", "CNPJ lab", 1000, "B", 700, 1));
        return new GetTabularUseCase.Result(rows, rows.size());
    }

    private static void requirePortfolio(UUID portfolioId) {
        if (portfolioId == null) {
            throw new PortfolioValidationException("portfolioId obrigatório");
        }
    }
}
