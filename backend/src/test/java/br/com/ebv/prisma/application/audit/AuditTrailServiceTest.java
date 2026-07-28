package br.com.ebv.prisma.application.audit;

import br.com.ebv.prisma.domain.audit.port.in.AppendAuditEventUseCase;
import br.com.ebv.prisma.domain.audit.port.in.ExportAuditTrailUseCase;
import br.com.ebv.prisma.domain.audit.port.out.AuditTrailRepositoryPort;
import br.com.ebv.prisma.domain.audit.port.out.AuditWormStoragePort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditTrailServiceTest {

    @Mock AuditTrailRepositoryPort repo;
    @Mock AuditWormStoragePort worm;

    AppendAuditEventService appendService;
    ExportAuditTrailService exportService;
    ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        appendService = new AppendAuditEventService(repo, worm, mapper);
        exportService = new ExportAuditTrailService(repo, mapper);
    }

    @Test
    @DisplayName("CT-01 append chains prev_sha256")
    void appendChained() {
        when(repo.findLatestSha256()).thenReturn(Optional.of("prevhash"));
        when(worm.put(any(), anyString())).thenReturn("file:///data/audit-worm/x.json");

        var result = appendService.execute(new AppendAuditEventUseCase.Command(
                "12345678901", "client-1", AppendAuditEventService.EVENT_DECISION_ISSUED,
                Map.of("decisionId", UUID.randomUUID().toString())
        ));

        assertThat(result.prevSha256()).isEqualTo("prevhash");
        assertThat(result.sha256()).hasSize(64);
        ArgumentCaptor<AuditTrailRepositoryPort.AuditEventRecord> cap =
                ArgumentCaptor.forClass(AuditTrailRepositoryPort.AuditEventRecord.class);
        verify(repo).saveEvent(cap.capture());
        assertThat(cap.getValue().prevSha256()).isEqualTo("prevhash");
        assertThat(cap.getValue().eventType()).isEqualTo("DECISION_ISSUED");
    }

    @Test
    @DisplayName("export → 202 PROCESSING + manifest_hash")
    void exportProcessing() {
        var result = exportService.execute(new ExportAuditTrailUseCase.Command(
                Map.of("event_types", java.util.List.of("DECISION_ISSUED")),
                "JSON",
                "AUDITORIA_ANPD"
        ));

        assertThat(result.status()).isEqualTo("PROCESSING");
        assertThat(result.manifestHash()).startsWith("sha256:");
        verify(repo).saveExport(any());
    }
}
