package br.com.ebv.prisma.application.subjectrequest;

import br.com.ebv.prisma.domain.subjectrequest.exception.SubjectRequestConflictException;
import br.com.ebv.prisma.domain.subjectrequest.port.in.OpenSubjectRequestUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.in.PatchSubjectRequestUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.out.SubjectRequestRepositoryPort;
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
class SubjectRequestServiceTest {

    @Mock SubjectRequestRepositoryPort repo;

    OpenSubjectRequestService openService;
    PatchSubjectRequestService patchService;

    @BeforeEach
    void setUp() {
        openService = new OpenSubjectRequestService(repo);
        patchService = new PatchSubjectRequestService(repo);
    }

    @Test
    @DisplayName("ACCESS → due_at +15d; DELETION → +30d")
    void dueByRightType() {
        Instant before = Instant.now();
        var access = openService.execute(new OpenSubjectRequestUseCase.Command(
                "ACCESS", "tok-1", "PORTAL", "Pedido de acesso"
        ));
        assertThat(access.status()).isEqualTo("OPEN");
        assertThat(access.dueAt()).isAfter(before.plus(14, ChronoUnit.DAYS));
        assertThat(access.dueAt()).isBefore(before.plus(16, ChronoUnit.DAYS));

        var deletion = openService.execute(new OpenSubjectRequestUseCase.Command(
                "DELETION", "tok-2", "PORTAL", "Pedido de exclusão"
        ));
        assertThat(deletion.dueAt()).isAfter(before.plus(29, ChronoUnit.DAYS));
        assertThat(deletion.dueAt()).isBefore(before.plus(31, ChronoUnit.DAYS));
    }

    @Test
    @DisplayName("COMPLETE already COMPLETED → 409")
    void completeTwiceConflict() {
        UUID id = UUID.randomUUID();
        when(repo.findById(id)).thenReturn(Optional.of(new SubjectRequestRepositoryPort.SubjectRequestRecord(
                id, "ACCESS", "tok", "PORTAL", "desc", "COMPLETED",
                Instant.now().plus(10, ChronoUnit.DAYS), "done", null,
                Instant.now(), Instant.now()
        )));

        assertThatThrownBy(() -> patchService.execute(new PatchSubjectRequestUseCase.Command(
                id, "COMPLETE", "again", null
        ))).isInstanceOf(SubjectRequestConflictException.class);
    }

    @Test
    @DisplayName("COMPLETE OPEN → COMPLETED")
    void completeOk() {
        UUID id = UUID.randomUUID();
        Instant created = Instant.now();
        when(repo.findById(id)).thenReturn(Optional.of(new SubjectRequestRepositoryPort.SubjectRequestRecord(
                id, "ACCESS", "tok", "PORTAL", "desc", "OPEN",
                created.plus(15, ChronoUnit.DAYS), null, null, created, created
        )));

        var r = patchService.execute(new PatchSubjectRequestUseCase.Command(
                id, "COMPLETE", "Relatório disponibilizado", UUID.randomUUID()
        ));

        assertThat(r.status()).isEqualTo("COMPLETED");
        ArgumentCaptor<SubjectRequestRepositoryPort.SubjectRequestRecord> cap =
                ArgumentCaptor.forClass(SubjectRequestRepositoryPort.SubjectRequestRecord.class);
        verify(repo).save(cap.capture());
        assertThat(cap.getValue().responseSummary()).contains("Relatório");
    }
}
