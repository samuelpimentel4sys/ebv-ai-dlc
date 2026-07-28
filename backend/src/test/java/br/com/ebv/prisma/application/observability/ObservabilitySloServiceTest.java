package br.com.ebv.prisma.application.observability;

import br.com.ebv.prisma.domain.observability.exception.TraceForbiddenException;
import br.com.ebv.prisma.domain.observability.exception.TraceNotFoundException;
import br.com.ebv.prisma.domain.observability.port.out.ObservabilityRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ObservabilitySloServiceTest {

    @Mock ObservabilityRepositoryPort observabilityRepo;

    ObjectMapper objectMapper = new ObjectMapper();
    GetSloService sloService;
    GetDecisionTraceService traceService;
    GetErrorBudgetService budgetService;

    @BeforeEach
    void setUp() {
        sloService = new GetSloService(observabilityRepo);
        traceService = new GetDecisionTraceService(observabilityRepo, objectMapper);
        budgetService = new GetErrorBudgetService(observabilityRepo);
    }

    @Test
    @DisplayName("CT-01 slo compliance true quando p95 <= 250")
    void sloComplianceTrue() {
        Instant now = Instant.now();
        when(observabilityRepo.findLatencies(any(), any(), eq("fintech_x"))).thenReturn(List.of(
                new ObservabilityRepositoryPort.LatencySample(180, "fintech_x", now),
                new ObservabilityRepositoryPort.LatencySample(190, "fintech_x", now),
                new ObservabilityRepositoryPort.LatencySample(200, "fintech_x", now),
                new ObservabilityRepositoryPort.LatencySample(210, "fintech_x", now),
                new ObservabilityRepositoryPort.LatencySample(220, "fintech_x", now)
        ));

        var result = sloService.execute("1h", "fintech_x");

        assertThat(result.targetP95Ms()).isEqualTo(250);
        assertThat(result.compliance()).isTrue();
        assertThat(result.p95Ms()).isLessThanOrEqualTo(new BigDecimal("250.0"));
        assertThat(result.errorBudgetRemainingPct()).isEqualByComparingTo("100.0");
        verify(observabilityRepo).saveSloSnapshot(any());
    }

    @Test
    @DisplayName("SloAggregator p95/p99 + burn alert")
    void aggregatorPercentilesAndBurn() {
        List<Integer> sorted = SloAggregator.sortedCopy(List.of(100, 200, 300, 400, 500, 600, 700, 800, 900, 1000));
        assertThat(SloAggregator.percentile(sorted, 0.95)).isEqualByComparingTo("1000.0");
        assertThat(SloAggregator.percentile(sorted, 0.99)).isEqualByComparingTo("1000.0");

        // 2/10 compliant (<=250) → remaining 20% → burnAlert
        BigDecimal remaining = SloAggregator.errorBudgetRemainingPct(
                List.of(100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)
        );
        assertThat(remaining).isEqualByComparingTo("20.0");
        assertThat(SloAggregator.burnAlert(remaining)).isTrue();
    }

    @Test
    @DisplayName("CT-03 trace expirado → TraceNotFoundException")
    void traceExpiredNotFound() {
        UUID id = UUID.randomUUID();
        Instant past = Instant.now().minus(1, ChronoUnit.DAYS);
        when(observabilityRepo.findTrace(id)).thenReturn(Optional.of(
                new ObservabilityRepositoryPort.TraceRecord(
                        id, "c1", "[{\"name\":\"features\"}]", past.minus(8, ChronoUnit.DAYS), past
                )
        ));

        assertThatThrownBy(() -> traceService.execute(id, null))
                .isInstanceOf(TraceNotFoundException.class);
    }

    @Test
    @DisplayName("CT-02/CT-04 trace ok + cross-tenant 403")
    void traceOkAndCrossTenantForbidden() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        when(observabilityRepo.findTrace(id)).thenReturn(Optional.of(
                new ObservabilityRepositoryPort.TraceRecord(
                        id, "tenant-a", "[{\"name\":\"score\",\"order\":2}]",
                        now, now.plus(7, ChronoUnit.DAYS)
                )
        ));

        var ok = traceService.execute(id, "tenant-a");
        assertThat(ok.spans()).hasSize(1);

        assertThatThrownBy(() -> traceService.execute(id, "tenant-b"))
                .isInstanceOf(TraceForbiddenException.class);
    }

    @Test
    @DisplayName("CT-05/CT-06 budget restante + alerta queima >50%")
    void budgetBurnAlert() {
        Instant now = Instant.now();
        when(observabilityRepo.findLatencies(any(), any(), isNull())).thenReturn(List.of(
                new ObservabilityRepositoryPort.LatencySample(100, null, now),
                new ObservabilityRepositoryPort.LatencySample(400, null, now),
                new ObservabilityRepositoryPort.LatencySample(500, null, now),
                new ObservabilityRepositoryPort.LatencySample(600, null, now)
        ));

        var result = budgetService.execute(null);
        // 1/4 compliant → 25% remaining → burnAlert true
        assertThat(result.errorBudgetRemainingPct()).isEqualByComparingTo("25.0");
        assertThat(result.burnAlert()).isTrue();
    }

    @Test
    @DisplayName("trace missing → TraceNotFoundException")
    void traceMissing() {
        UUID id = UUID.randomUUID();
        when(observabilityRepo.findTrace(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> traceService.execute(id, null))
                .isInstanceOf(TraceNotFoundException.class);
    }
}
