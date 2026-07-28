package br.com.ebv.prisma.application.analytics;

import br.com.ebv.prisma.domain.analytics.port.in.GetDeflectionUseCase;
import br.com.ebv.prisma.domain.analytics.port.out.AnalyticsRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsDeflectionServiceTest {

    @Mock AnalyticsRepositoryPort analyticsRepo;
    GetDeflectionService service;

    @BeforeEach
    void setUp() {
        service = new GetDeflectionService(analyticsRepo, new ObjectMapper());
    }

    @Test
    @DisplayName("F09 deflection lê seed e calcula delta vs baseline")
    void deflectionFromSeed() {
        when(analyticsRepo.findLatestByKey("DEFLECTION_RATE")).thenReturn(Optional.of(
                new AnalyticsRepositoryPort.SacMetricRecord(
                        UUID.randomUUID(), "DEFLECTION_RATE", "SELF_SERVICE",
                        LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 27),
                        new BigDecimal("0.720000"),
                        "{\"deflectedCases\":8640,\"totalCases\":12000,\"reclassified48h\":310}"
                )
        ));
        when(analyticsRepo.findLatestByKey("BASELINE_DEFLECTION")).thenReturn(Optional.of(
                new AnalyticsRepositoryPort.SacMetricRecord(
                        UUID.randomUUID(), "BASELINE_DEFLECTION", null,
                        LocalDate.of(2025, 1, 1), LocalDate.of(2025, 6, 30),
                        new BigDecimal("0.180000"), "{\"label\":\"pre-prisma\"}"
                )
        ));

        var r = service.execute(new GetDeflectionUseCase.Query(null, null));
        assertThat(r.deflectionRate()).isEqualByComparingTo("0.720000");
        assertThat(r.deflectedCases()).isEqualTo(8640);
        assertThat(r.baselineDeflectionRate()).isEqualByComparingTo("0.180000");
        assertThat(r.deltaPp()).isEqualByComparingTo("0.54");
    }
}
