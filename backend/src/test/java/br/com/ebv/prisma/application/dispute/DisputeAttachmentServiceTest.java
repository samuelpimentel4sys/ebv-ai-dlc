package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.exception.DisputeValidationException;
import br.com.ebv.prisma.domain.dispute.port.in.GetEvidencePackUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.UploadDisputeAttachmentUseCase;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeAttachmentRepositoryPort;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeEvidenceStorePort;
import br.com.ebv.prisma.domain.dispute.port.out.DisputeRepositoryPort;
import br.com.ebv.prisma.infrastructure.adapter.worm.LocalDisputeEvidenceStoreAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DisputeAttachmentServiceTest {

    @Mock DisputeRepositoryPort disputes;
    @Mock DisputeAttachmentRepositoryPort attachments;
    DisputeEvidenceStorePort store;
    DisputeAttachmentService service;

    @TempDir Path tempDir;

    @BeforeEach
    void setUp() {
        store = new LocalDisputeEvidenceStoreAdapter(tempDir.toString());
        service = new DisputeAttachmentService(disputes, attachments, store);
    }

    @Test
    @DisplayName("F08 upload PDF → STORED_IMMUTABLE + sha256")
    void uploadPdf() {
        UUID disputeId = UUID.randomUUID();
        when(disputes.findById(disputeId)).thenReturn(Optional.of(new DisputeRepositoryPort.DisputeRecord(
                disputeId, "CT-X", "12345678901", "OPEN", "R", "d", "API",
                Instant.now(), null, null, null, Instant.now()
        )));
        when(attachments.findByDisputeId(disputeId)).thenReturn(List.of());

        byte[] pdf = "%PDF-1.4 lab stub".getBytes(StandardCharsets.UTF_8);
        var r = service.execute(new UploadDisputeAttachmentUseCase.Command(
                disputeId, "comprovante.pdf", "application/pdf", pdf, null
        ));

        assertThat(r.status()).isEqualTo("STORED_IMMUTABLE");
        assertThat(r.sha256()).hasSize(64);
        verify(attachments).save(any());
    }

    @Test
    @DisplayName("F08 MIME exe → 422")
    void mimeRejected() {
        UUID disputeId = UUID.randomUUID();
        when(disputes.findById(disputeId)).thenReturn(Optional.of(new DisputeRepositoryPort.DisputeRecord(
                disputeId, "CT-X", "12345678901", "OPEN", "R", "d", "API",
                Instant.now(), null, null, null, Instant.now()
        )));

        assertThatThrownBy(() -> service.execute(new UploadDisputeAttachmentUseCase.Command(
                disputeId, "x.exe", "application/x-msdownload", new byte[]{1, 2, 3}, null
        ))).isInstanceOf(DisputeValidationException.class);
    }

    @Test
    @DisplayName("F08 evidence-pack gera manifestHash")
    void evidencePack() {
        UUID disputeId = UUID.randomUUID();
        UUID attId = UUID.randomUUID();
        when(disputes.findById(disputeId)).thenReturn(Optional.of(new DisputeRepositoryPort.DisputeRecord(
                disputeId, "CT-X", "12345678901", "OPEN", "R", "d", "API",
                Instant.now(), null, null, null, Instant.now()
        )));
        when(attachments.findByDisputeId(disputeId)).thenReturn(List.of(
                new DisputeAttachmentRepositoryPort.AttachmentRecord(
                        attId, disputeId, "a.pdf", "application/pdf",
                        "abc", "file:///tmp/a", null, Instant.now()
                )
        ));

        var pack = service.execute(new GetEvidencePackUseCase.Query(disputeId));
        assertThat(pack.manifestHash()).hasSize(64);
        assertThat(pack.files()).hasSize(1);
    }
}
