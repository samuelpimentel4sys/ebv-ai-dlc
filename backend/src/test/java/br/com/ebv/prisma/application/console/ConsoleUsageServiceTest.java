package br.com.ebv.prisma.application.console;

import br.com.ebv.prisma.domain.console.port.in.GetConsoleUsageUseCase;
import br.com.ebv.prisma.domain.console.port.out.ConsoleRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsoleUsageServiceTest {

    @Mock ConsoleRepositoryPort consoleRepo;
    GetConsoleUsageService service;

    @BeforeEach
    void setUp() {
        service = new GetConsoleUsageService(consoleRepo);
    }

    @Test
    @DisplayName("F04 usage agrega totals do tenant demo")
    void usageTotals() {
        when(consoleRepo.findUsageByTenant("demo-tenant")).thenReturn(List.of(
                new ConsoleRepositoryPort.UsageRecord(
                        UUID.randomUUID(), "demo-tenant", "credit.score", "PRODUCTION",
                        100L, new BigDecimal("50.00"), "BRL",
                        LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31), Instant.now()
                ),
                new ConsoleRepositoryPort.UsageRecord(
                        UUID.randomUUID(), "demo-tenant", "credit.decision", "SANDBOX",
                        20L, new BigDecimal("5.00"), "BRL",
                        LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31), Instant.now()
                )
        ));

        var r = service.execute(new GetConsoleUsageUseCase.Query(null));
        assertThat(r.tenantId()).isEqualTo("demo-tenant");
        assertThat(r.items()).hasSize(2);
        assertThat(r.totals().callCount()).isEqualTo(120L);
        assertThat(r.totals().amount()).isEqualByComparingTo("55.00");
    }
}
