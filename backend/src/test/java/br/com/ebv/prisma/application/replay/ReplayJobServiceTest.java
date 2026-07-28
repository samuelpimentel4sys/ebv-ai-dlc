package br.com.ebv.prisma.application.replay;

import br.com.ebv.prisma.domain.replay.exception.ReplayConflictException;
import br.com.ebv.prisma.domain.replay.exception.ReplayForbiddenException;
import br.com.ebv.prisma.domain.replay.exception.ReplayNotFoundException;
import br.com.ebv.prisma.domain.replay.exception.ReplayValidationException;
import br.com.ebv.prisma.domain.replay.port.in.CreateReplayJobUseCase;
import br.com.ebv.prisma.domain.replay.port.out.ReplayJobRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReplayJobServiceTest {

    @Mock ReplayJobRepositoryPort replayRepo;

    CreateReplayJobService createService;
    GetReplayJobService getService;
    AbortReplayJobService abortService;

    @BeforeEach
    void setUp() {
        createService = new CreateReplayJobService(replayRepo);
        getService = new GetReplayJobService(replayRepo);
        abortService = new AbortReplayJobService(replayRepo);
    }

    @Test
    @DisplayName("CT-01 job sandbox com approval → QUEUED")
    void createSandboxQueued() {
        Instant start = Instant.parse("2026-01-01T00:00:00Z");
        Instant end = Instant.parse("2026-01-31T23:59:59Z");

        var result = createService.execute(new CreateReplayJobUseCase.Command(
                start, end, "SANDBOX", "u-approver", "Auditoria STJ case 2026-441", null
        ));

        assertThat(result.status()).isEqualTo("QUEUED");
        assertThat(result.targetEnv()).isEqualTo("SANDBOX");

        ArgumentCaptor<ReplayJobRepositoryPort.ReplayJobRecord> cap =
                ArgumentCaptor.forClass(ReplayJobRepositoryPort.ReplayJobRecord.class);
        verify(replayRepo).save(cap.capture());
        assertThat(cap.getValue().outputUri()).contains("s3://prisma-sandbox/replay/");
        assertThat(cap.getValue().justification()).contains("Auditoria");
    }

    @Test
    @DisplayName("CT-02 target prod bus → 403")
    void productionBusForbidden() {
        assertThatThrownBy(() -> createService.execute(new CreateReplayJobUseCase.Command(
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-02T00:00:00Z"),
                "PRODUCTION_BUS",
                "u-approver",
                "justificativa",
                null
        ))).isInstanceOf(ReplayForbiddenException.class);
    }

    @Test
    @DisplayName("CT-03 sem justificativa → 422")
    void blankJustificationUnprocessable() {
        assertThatThrownBy(() -> createService.execute(new CreateReplayJobUseCase.Command(
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-02T00:00:00Z"),
                "SANDBOX",
                "u-approver",
                "  ",
                null
        ))).isInstanceOf(ReplayValidationException.class);
    }

    @Test
    @DisplayName("CT-07 sem approver → 403")
    void missingApproverForbidden() {
        assertThatThrownBy(() -> createService.execute(new CreateReplayJobUseCase.Command(
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-02T00:00:00Z"),
                "SANDBOX",
                null,
                "ok",
                null
        ))).isInstanceOf(ReplayForbiddenException.class);
    }

    @Test
    @DisplayName("CT-04 GET status")
    void getStatus() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        when(replayRepo.findById(id)).thenReturn(Optional.of(
                new ReplayJobRepositoryPort.ReplayJobRecord(
                        id, now.minusSeconds(3600), now, "RUNNING",
                        UUID.randomUUID(), UUID.randomUUID(), "j",
                        "s3://prisma-sandbox/replay/" + id + "/", "SANDBOX", now, null
                )
        ));

        var result = getService.execute(id);
        assertThat(result.status()).isEqualTo("RUNNING");
        assertThat(result.outputUri()).contains(id.toString());
    }

    @Test
    @DisplayName("CT-05 abort RUNNING → ABORTED")
    void abortRunning() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        when(replayRepo.findById(id)).thenReturn(Optional.of(
                new ReplayJobRepositoryPort.ReplayJobRecord(
                        id, now.minusSeconds(3600), now, "RUNNING",
                        UUID.randomUUID(), UUID.randomUUID(), "j",
                        "s3://x", "SANDBOX", now, null
                )
        ));

        var result = abortService.execute(id);
        assertThat(result.status()).isEqualTo("ABORTED");

        ArgumentCaptor<ReplayJobRepositoryPort.ReplayJobRecord> cap =
                ArgumentCaptor.forClass(ReplayJobRepositoryPort.ReplayJobRecord.class);
        verify(replayRepo).save(cap.capture());
        assertThat(cap.getValue().status()).isEqualTo("ABORTED");
        assertThat(cap.getValue().finishedAt()).isNotNull();
    }

    @Test
    @DisplayName("CT-06 abort DONE → 409")
    void abortDoneConflict() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        when(replayRepo.findById(id)).thenReturn(Optional.of(
                new ReplayJobRepositoryPort.ReplayJobRecord(
                        id, now.minusSeconds(3600), now, "DONE",
                        UUID.randomUUID(), UUID.randomUUID(), "j",
                        "s3://x", "SANDBOX", now, now
                )
        ));

        assertThatThrownBy(() -> abortService.execute(id))
                .isInstanceOf(ReplayConflictException.class);
    }

    @Test
    @DisplayName("GET job missing → not found")
    void getMissing() {
        UUID id = UUID.randomUUID();
        when(replayRepo.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> getService.execute(id))
                .isInstanceOf(ReplayNotFoundException.class);
    }
}
