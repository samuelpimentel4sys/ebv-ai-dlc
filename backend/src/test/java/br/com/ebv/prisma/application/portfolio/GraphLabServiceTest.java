package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetGraphUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class GraphLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    GraphLabService svc;
    @BeforeEach void setUp() { svc = new GraphLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F01 GET graph lab stub")
    void graph() {
        var r = svc.execute(new GetGraphUseCase.Query(UUID.randomUUID(), 2, 50000));
        assertThat(r.nodeCount()).isPositive();
        assertThat(r.lod()).isEqualTo(2);
    }
}
