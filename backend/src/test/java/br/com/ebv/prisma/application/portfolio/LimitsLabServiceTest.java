package br.com.ebv.prisma.application.portfolio;

import br.com.ebv.prisma.domain.portfolio.port.in.LimitsUseCases.UpsertLimitUseCase;
import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class LimitsLabServiceTest {
    @Mock PortfolioRepositoryPort repo;
    LimitsLabService svc;
    @BeforeEach void setUp() { svc = new LimitsLabService(repo); }
    @Test @DisplayName("F04 upsert limit")
    void upsert() {
        var r = svc.execute(new UpsertLimitUseCase.Command(
                UUID.randomUUID(), "SETOR", new BigDecimal("30.0"), new BigDecimal("27.0")));
        assertThat(r.dimension()).isEqualTo("SETOR");
        verify(repo).saveLimit(any());
    }
}
