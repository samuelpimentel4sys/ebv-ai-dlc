package br.com.ebv.prisma.application.dossier;

import br.com.ebv.prisma.domain.audit.port.in.AppendAuditEventUseCase;
import br.com.ebv.prisma.domain.counterfactual.port.out.CounterfactualRepositoryPort;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.dossier.exception.DossierNotFoundException;
import br.com.ebv.prisma.domain.dossier.port.in.IssueDossierUseCase;
import br.com.ebv.prisma.domain.dossier.port.out.DossierRepositoryPort;
import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DossierServiceTest {

    @Mock DecisionRepositoryPort decisionRepo;
    @Mock ExplanationRepositoryPort explanationRepo;
    @Mock CounterfactualRepositoryPort counterfactualRepo;
    @Mock DossierRepositoryPort dossierRepo;
    @Mock AppendAuditEventUseCase appendAuditEvent;

    @TempDir Path tempDir;

    ObjectMapper mapper = new ObjectMapper();
    IssueDossierService issueService;
    GetDossierService getService;
    DownloadDossierService downloadService;

    @BeforeEach
    void setUp() {
        issueService = new IssueDossierService(
                decisionRepo, explanationRepo, counterfactualRepo, dossierRepo,
                appendAuditEvent, mapper, tempDir.toString()
        );
        getService = new GetDossierService(dossierRepo, mapper);
        downloadService = new DownloadDossierService(dossierRepo, tempDir.toString());
    }

    @Test
    @DisplayName("issue dossier → ISSUED + DOSSIER_ISSUED audit + JSON artifact")
    void issueCreatesArtifact() {
        UUID decisionId = UUID.randomUUID();
        when(decisionRepo.findById(decisionId)).thenReturn(Optional.of(decision(decisionId)));
        when(explanationRepo.findByDecisionId(decisionId)).thenReturn(Optional.empty());
        when(counterfactualRepo.findByDecisionId(decisionId)).thenReturn(Optional.empty());
        when(appendAuditEvent.execute(any())).thenReturn(
                new AppendAuditEventUseCase.Result(UUID.randomUUID(), "sha", null)
        );

        var r = issueService.execute(new IssueDossierUseCase.Command(
                decisionId, "RESPOSTA_ANPD", "LGPD_ART20", List.of("PDF", "JSON"), "dpo-1"
        ));

        assertThat(r.status()).isEqualTo("ISSUED");
        assertThat(r.formats()).contains("PDF", "JSON");
        assertThat(r.documentHash()).startsWith("sha256:");
        assertThat(tempDir.resolve(r.dossierId() + ".json")).exists();

        ArgumentCaptor<AppendAuditEventUseCase.Command> auditCap =
                ArgumentCaptor.forClass(AppendAuditEventUseCase.Command.class);
        verify(appendAuditEvent).execute(auditCap.capture());
        assertThat(auditCap.getValue().eventType()).isEqualTo(IssueDossierService.EVENT_DOSSIER_ISSUED);

        verify(dossierRepo).save(any());
    }

    @Test
    @DisplayName("get missing → DossierNotFoundException")
    void getMissing404() {
        UUID id = UUID.randomUUID();
        when(dossierRepo.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> getService.execute(id))
                .isInstanceOf(DossierNotFoundException.class);
    }

    @Test
    @DisplayName("purpose blank → 400")
    void purposeRequired() {
        assertThatThrownBy(() -> issueService.execute(new IssueDossierUseCase.Command(
                UUID.randomUUID(), "  ", "LGPD_ART20", List.of("JSON"), "x"
        ))).isInstanceOf(IllegalArgumentException.class);
    }

    private static DecisionRepositoryPort.DecisionRecord decision(UUID id) {
        return new DecisionRepositoryPort.DecisionRecord(
                id, "12345678901", new BigDecimal("480"), "m1", "REJECT",
                "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                null, "file://worm/x", Instant.now(), 12, List.of(), "client",
                false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
        );
    }
}
