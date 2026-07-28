package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeForbiddenException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeLockoutException;
import br.com.ebv.prisma.domain.dispute.port.in.GetDisputeTrackingUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeTrackingServiceTest {

    @Mock DisputeRepositoryPort repo;
    InMemoryDisputeLockoutAdapter lockout;
    DisputeTrackingService service;

    @BeforeEach
    void setUp() {
        lockout = new InMemoryDisputeLockoutAdapter();
        service = new DisputeTrackingService(repo, lockout);
    }

    @Test
    @DisplayName("F01 tracking com last4 válido")
    void trackingOk() {
        UUID id = UUID.randomUUID();
        Instant due = Instant.now().plus(5, ChronoUnit.DAYS);
        when(repo.findByProtocol("CT-20260728-ABCD")).thenReturn(Optional.of(
                new DisputeRepositoryPort.DisputeRecord(
                        id, "CT-20260728-ABCD", "12345678901", "OPEN",
                        "R", "d", "API", due, null, null, null, Instant.now()
                )
        ));
        when(repo.timelineByDisputeId(id)).thenReturn(List.of(
                new DisputeRepositoryPort.TimelineEvent(1L, id, "OPENED", "ok", "SYSTEM", Instant.now())
        ));

        var r = service.execute(new GetDisputeTrackingUseCase.Query("CT-20260728-ABCD", "8901"));
        assertThat(r.stage()).isEqualTo("RECEBIDA");
        assertThat(r.daysRemaining()).isGreaterThanOrEqualTo(4);
        assertThat(r.nextActor()).isEqualTo("ANALISTA");
    }

    @Test
    @DisplayName("F01 3 confirmações inválidas → lockout")
    void trackingLockout() {
        UUID id = UUID.randomUUID();
        when(repo.findByProtocol("CT-LOCK")).thenReturn(Optional.of(
                new DisputeRepositoryPort.DisputeRecord(
                        id, "CT-LOCK", "12345678901", "OPEN",
                        "R", "d", "API", Instant.now().plus(3, ChronoUnit.DAYS),
                        null, null, null, Instant.now()
                )
        ));

        for (int i = 0; i < 2; i++) {
            assertThatThrownBy(() -> service.execute(new GetDisputeTrackingUseCase.Query("CT-LOCK", "0000")))
                    .isInstanceOf(DisputeForbiddenException.class);
        }
        assertThatThrownBy(() -> service.execute(new GetDisputeTrackingUseCase.Query("CT-LOCK", "0000")))
                .isInstanceOf(DisputeLockoutException.class);
    }
}
