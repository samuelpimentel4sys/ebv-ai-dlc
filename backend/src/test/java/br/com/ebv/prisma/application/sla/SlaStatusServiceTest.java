package br.com.ebv.prisma.application.sla;

import br.com.ebv.prisma.domain.sla.port.in.GetSlaStatusUseCase;
import br.com.ebv.prisma.domain.sla.port.out.SlaRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlaStatusServiceTest {

    @Mock SlaRepositoryPort slaRepo;
    GetSlaStatusService service;

    @BeforeEach
    void setUp() {
        service = new GetSlaStatusService(slaRepo);
    }

    @Test
    @DisplayName("F06 status agrega onTrack/atRisk/overdue e cria escalation")
    void statusAggregatesAndEscalates() {
        Instant now = Instant.now();
        UUID overdueId = UUID.randomUUID();
        UUID riskId = UUID.randomUUID();
        UUID okId = UUID.randomUUID();

        when(slaRepo.findActivePolicy()).thenReturn(Optional.of(
                new SlaRepositoryPort.PolicyRecord(
                        UUID.randomUUID(), "p", 80, "[\"EMAIL\"]", "ACTIVE", now
                )
        ));
        when(slaRepo.listOpenDisputes()).thenReturn(List.of(
                new SlaRepositoryPort.OpenDisputeSla(
                        overdueId, "CT-OVER", "OPEN",
                        now.minus(1, ChronoUnit.DAYS), now.minus(8, ChronoUnit.DAYS)
                ),
                new SlaRepositoryPort.OpenDisputeSla(
                        riskId, "CT-RISK", "OPEN",
                        now.plus(1, ChronoUnit.DAYS), now.minus(6, ChronoUnit.DAYS)
                ),
                new SlaRepositoryPort.OpenDisputeSla(
                        okId, "CT-OK", "OPEN",
                        now.plus(5, ChronoUnit.DAYS), now.minus(1, ChronoUnit.DAYS)
                )
        ));
        when(slaRepo.hasRecentEscalation(any(), anyInt(), any())).thenReturn(false);

        var r = service.execute(new GetSlaStatusUseCase.Query("24h"));

        assertThat(r.counts().overdue()).isEqualTo(1);
        assertThat(r.counts().atRisk()).isEqualTo(1);
        assertThat(r.counts().onTrack()).isEqualTo(1);
        assertThat(r.escalationsCreated()).isEqualTo(2);

        ArgumentCaptor<SlaRepositoryPort.EscalationRecord> cap =
                ArgumentCaptor.forClass(SlaRepositoryPort.EscalationRecord.class);
        verify(slaRepo, org.mockito.Mockito.times(2)).saveEscalation(cap.capture());
        assertThat(cap.getAllValues()).extracting(SlaRepositoryPort.EscalationRecord::disputeId)
                .containsExactlyInAnyOrder(overdueId, riskId);
    }

    @Test
    @DisplayName("F06 escalation idempotente em 6h")
    void escalationIdempotent() {
        Instant now = Instant.now();
        UUID id = UUID.randomUUID();
        when(slaRepo.findActivePolicy()).thenReturn(Optional.empty());
        when(slaRepo.listOpenDisputes()).thenReturn(List.of(
                new SlaRepositoryPort.OpenDisputeSla(
                        id, "CT-X", "OPEN", now.minus(1, ChronoUnit.HOURS), now.minus(8, ChronoUnit.DAYS)
                )
        ));
        when(slaRepo.hasRecentEscalation(eq(id), eq(2), any())).thenReturn(true);

        var r = service.execute(new GetSlaStatusUseCase.Query("24h"));
        assertThat(r.counts().overdue()).isEqualTo(1);
        assertThat(r.escalationsCreated()).isZero();
        verify(slaRepo, never()).saveEscalation(any());
    }
}
