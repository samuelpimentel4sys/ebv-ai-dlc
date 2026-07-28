package br.com.ebv.prisma.infrastructure.adapter.graph;

import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioGraphStorePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnProperty(name = "prisma.graph.backend", havingValue = "stub", matchIfMissing = true)
public class StubPortfolioGraphAdapter implements PortfolioGraphStorePort {

    @Override
    public boolean live() {
        return false;
    }

    @Override
    public void ensureLabSeed() {
        // no-op
    }

    @Override
    public GraphSnapshot loadGraph(int maxNodes) {
        return new GraphSnapshot(List.of(), List.of(), false);
    }
}
