package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.AggregatesUseCases.RefreshAggregatesUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AggregatesLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    AggregatesLabService svc;
    @BeforeEach void setUp() { svc = new AggregatesLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F05 refresh aggregates")
    void refresh() {
        var r = svc.execute(new RefreshAggregatesUseCase.Command(
                "exposure_by_sector", "INCREMENTAL", List.of("2026-07-27")));
        assertThat(r.jobId()).startsWith("job-");
        verify(repo).saveCubeJob(any());
    }
}
