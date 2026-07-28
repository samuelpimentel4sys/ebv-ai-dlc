package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.CommunitiesUseCases.DetectCommunitiesUseCase;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CommunitiesLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    CommunitiesLabService svc;
    @BeforeEach void setUp() { svc = new CommunitiesLabService(repo, new ObjectMapper()); }
    @Test @DisplayName("F06 detect communities")
    void detect() {
        var r = svc.execute(new DetectCommunitiesUseCase.Command(UUID.randomUUID(), 5, "LOUVAIN"));
        assertThat(r.runId()).startsWith("comm-run-");
        verify(repo).saveCommunityRun(any());
        verify(repo).saveCommunity(any());
    }
}
