package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.ReportsUseCases.CreateReportUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ReportsLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    ReportsLabService svc;
    @BeforeEach void setUp() { svc = new ReportsLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F08 create report")
    void create() {
        var r = svc.execute(new CreateReportUseCase.Command(
                UUID.randomUUID(), "Comitê Jul/2026", "Diretoria",
                List.of(new CreateReportUseCase.Section("STRESS", "run-55", 1))));
        assertThat(r.reportId()).startsWith("rep-");
        verify(repo).saveReport(any());
    }
}
