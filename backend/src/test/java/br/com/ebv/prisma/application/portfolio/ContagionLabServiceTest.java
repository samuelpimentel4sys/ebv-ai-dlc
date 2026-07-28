package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.ContagionUseCases.SimulateContagionUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ContagionLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    ContagionLabService svc;
    @BeforeEach void setUp() { svc = new ContagionLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F02 simulate contagion persists")
    void simulate() {
        var r = svc.execute(new SimulateContagionUseCase.Command(
                UUID.randomUUID(), "n-1001", new BigDecimal("0.35"), 4, List.of("FORNECEDOR")));
        assertThat(r.simId()).startsWith("sim-");
        verify(repo).saveContagion(any());
    }
}
