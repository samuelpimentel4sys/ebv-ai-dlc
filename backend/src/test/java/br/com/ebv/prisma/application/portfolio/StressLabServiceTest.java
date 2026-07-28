package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.StressUseCases.RunStressUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class StressLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    StressLabService svc;
    @BeforeEach void setUp() { svc = new StressLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F03 stress run lab")
    void run() {
        var r = svc.execute(new RunStressUseCase.Command(
                UUID.randomUUID(), Map.of("selic", 15.75), true));
        assertThat(r.runId()).startsWith("run-");
        assertThat(r.status()).isEqualTo("COMPLETED");
        verify(repo).saveStressRun(any());
    }
}
