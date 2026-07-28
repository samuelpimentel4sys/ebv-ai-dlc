package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeConflictException;
import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.OpenDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ResolveDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeWorkflowServiceTest {

    @Mock DisputeRepositoryPort repo;

    OpenDisputeService openService;
    ResolveDisputeService resolveService;
    ListDisputeQueueService queueService;

    @BeforeEach
    void setUp() {
        openService = new OpenDisputeService(repo);
        resolveService = new ResolveDisputeService(repo);
        queueService = new ListDisputeQueueService(repo);
    }

    @Test
    @DisplayName("F02 POST cria dispute OPEN + dueAt +7d")
    void openCreatesSla() {
        Instant before = Instant.now();
        var r = openService.execute(new OpenDisputeUseCase.Command(
                "12345678901", "NAO_RECONHECO_DIVIDA",
                "Descrição com mais de vinte caracteres.", "API", null
        ));
        assertThat(r.status()).isEqualTo("OPEN");
        assertThat(r.protocol()).startsWith("CT-");
        assertThat(r.dueAt()).isAfter(before.plus(6, ChronoUnit.DAYS));
        assertThat(r.dueAt()).isBefore(before.plus(8, ChronoUnit.DAYS));
        verify(repo).save(org.mockito.ArgumentMatchers.any());
        verify(repo).appendTimeline(org.mockito.ArgumentMatchers.eq(r.id()),
                org.mockito.ArgumentMatchers.eq("OPENED"),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("F02 resolve OPEN → RESOLVED_FAVOR_TITULAR")
    void resolveOk() {
        UUID id = UUID.randomUUID();
        Instant created = Instant.now();
        when(repo.findById(id)).thenReturn(Optional.of(new DisputeRepositoryPort.DisputeRecord(
                id, "CT-20260728-TEST", "12345678901", "OPEN",
                "MOTIVO", "desc longa suficiente aqui", "API",
                created.plus(7, ChronoUnit.DAYS), null, null, null, created
        )));

        var r = resolveService.execute(new ResolveDisputeUseCase.Command(
                id, "PROCEDENTE", "Fonte não comprovou a dívida no prazo interno."
        ));

        assertThat(r.status()).isEqualTo("RESOLVED_FAVOR_TITULAR");
        ArgumentCaptor<DisputeRepositoryPort.DisputeRecord> cap =
                ArgumentCaptor.forClass(DisputeRepositoryPort.DisputeRecord.class);
        verify(repo).save(cap.capture());
        assertThat(cap.getValue().resolutionRationale()).contains("Fonte");
    }

    @Test
    @DisplayName("F02 resolve sem rationale → 422")
    void resolveWithoutRationale() {
        assertThatThrownBy(() -> resolveService.execute(new ResolveDisputeUseCase.Command(
                UUID.randomUUID(), "PROCEDENTE", "  "
        ))).isInstanceOf(DisputeValidationException.class);
    }

    @Test
    @DisplayName("F02 resolve já resolvida → 409")
    void resolveTwiceConflict() {
        UUID id = UUID.randomUUID();
        when(repo.findById(id)).thenReturn(Optional.of(new DisputeRepositoryPort.DisputeRecord(
                id, "CT-X", "12345678901", "RESOLVED_MAINTAIN",
                "M", "desc", "API", Instant.now(), Instant.now(), "IMPROCEDENTE", "r", Instant.now()
        )));

        assertThatThrownBy(() -> resolveService.execute(new ResolveDisputeUseCase.Command(
                id, "PROCEDENTE", "Tentativa inválida de reabrir desfecho."
        ))).isInstanceOf(DisputeConflictException.class);
    }
}
