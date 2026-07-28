package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.HistoryUseCases.GetSnapshotUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HistoryLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    HistoryLabService svc;
    @BeforeEach void setUp() { svc = new HistoryLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F07 snapshot as-of")
    void snapshot() {
        when(repo.findSnapshot(any(), any())).thenReturn(Optional.empty());
        var r = svc.execute(new GetSnapshotUseCase.Query(UUID.randomUUID(), LocalDate.of(2026, 1, 15)));
        assertThat(r.nodeCount()).isEqualTo(15_000);
        assertThat(r.asOfDate()).isEqualTo(LocalDate.of(2026, 1, 15));
    }
}
