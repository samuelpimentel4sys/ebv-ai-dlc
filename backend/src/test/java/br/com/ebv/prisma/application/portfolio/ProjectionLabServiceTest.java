package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.GraphUseCases.GetProjection2dUseCase;
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
class ProjectionLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    GraphLabService svc;
    @BeforeEach void setUp() { svc = new GraphLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F09 projection 2d parity")
    void projection2d() {
        var r = svc.execute(new GetProjection2dUseCase.Query(UUID.randomUUID(), "flt-9c1"));
        assertThat(r.parityWith3d()).isTrue();
        assertThat(r.nodes()).isNotEmpty();
    }
}
