package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.exception.PortfolioNotFoundException;
import br.com.ebv.prisma.domain.portfolio.exception.PortfolioValidationException;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.FilterGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphNodeUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetProjection2dUseCase;
import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetTabularUseCase;
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
    private final ObjectMapper mapper;

    public GraphLabService(PortfolioRepositoryPort repo, ObjectMapper mapper) {
        this.repo = repo;
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
        var nodes = List.of(
                new GetGraphUseCase.Node("n-1001", 1_250_000.50, "C", 612, 0.12, 0.44, 0.08),
                new GetGraphUseCase.Node("n-2044", 890_000.00, "B", 701, 0.33, 0.21, 0.15)
        );
        var edges = List.of(new GetGraphUseCase.Edge("n-1001", "n-2044", 0.37, "FORNECEDOR"));
        boolean truncated = max < nodes.size();
        return new GetGraphUseCase.Result(
                query.portfolioId(), lod, nodes.size(), edges.size(),
                "agg-lab-" + Instant.now(), System.currentTimeMillis() - t0,
                truncated ? nodes.subList(0, Math.max(1, max)) : nodes, edges, truncated
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
        return new FilterGraphUseCase.Result(filterId, command.portfolioId(), lod, max, 2, false);
    }

    @Override
    @Transactional(readOnly = true)
    public GetProjection2dUseCase.Result execute(GetProjection2dUseCase.Query query) {
        requirePortfolio(query.portfolioId());
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
        var rows = List.of(new GetTabularUseCase.Row("n-1", "CNPJ lab", 1000, "B", 700, 1));
        return new GetTabularUseCase.Result(rows, rows.size());
    }

    private static void requirePortfolio(UUID portfolioId) {
        if (portfolioId == null) {
            throw new PortfolioValidationException("portfolioId obrigatório");
        }
    }
}
