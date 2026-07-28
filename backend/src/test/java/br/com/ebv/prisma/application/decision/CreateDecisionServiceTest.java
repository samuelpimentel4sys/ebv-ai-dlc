package br.com.ebv.prisma.application.decision;

import br.com.ebv.prisma.domain.audit.port.in.AppendAuditEventUseCase;
import br.com.ebv.prisma.domain.counterfactual.port.out.CounterfactualRepositoryPort;
import br.com.ebv.prisma.domain.decision.exception.ChainBrokenException;
import br.com.ebv.prisma.domain.decision.exception.WormWriteException;
import br.com.ebv.prisma.domain.decision.port.in.CreateDecisionUseCase;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.decision.port.out.WormStoragePort;
import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import br.com.ebv.prisma.domain.features.port.in.GetFeaturesUseCase;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ScoreRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreateDecisionServiceTest {

    @Mock ScoreRepositoryPort scoreRepo;
    @Mock RecalculateScoreUseCase recalculateScore;
    @Mock GetFeaturesUseCase getFeatures;
    @Mock WormStoragePort wormStorage;
    @Mock DecisionRepositoryPort decisionRepo;
    @Mock br.com.ebv.prisma.domain.observability.port.out.ObservabilityRepositoryPort observabilityRepo;
    @Mock AppendAuditEventUseCase appendAuditEvent;
    @Mock ExplanationRepositoryPort explanationRepo;
    @Mock CounterfactualRepositoryPort counterfactualRepo;

    ObjectMapper objectMapper = new ObjectMapper();
    CreateDecisionService service;
    VerifyDecisionService verifyService;

    @BeforeEach
    void setUp() {
        service = new CreateDecisionService(
                scoreRepo, recalculateScore, getFeatures, wormStorage, decisionRepo, observabilityRepo,
                appendAuditEvent, explanationRepo, counterfactualRepo, objectMapper
        );
        verifyService = new VerifyDecisionService(decisionRepo, wormStorage);
    }

    @Test
    @DisplayName("CT-01 happy path: WORM write + persist tb_decision")
    void happyPathWritesWormAndPersists() {
        when(scoreRepo.findCurrent("12345678901")).thenReturn(Optional.of(
                new ScoreRepositoryPort.CurrentScore(
                        "12345678901", new BigDecimal("712.40"), "score-v3.2.1", Instant.now()
                )
        ));
        when(getFeatures.execute(eq("12345678901"), any(), any())).thenReturn(
                new GetFeaturesUseCase.FeaturesResult("12345678901", Instant.now(), true, Map.of())
        );
        when(decisionRepo.findLatestByDocumento("12345678901")).thenReturn(Optional.empty());
        when(wormStorage.put(any(), anyString())).thenReturn("file:///data/worm/x.json");

        var result = service.execute(new CreateDecisionUseCase.Command(
                "12345678901", "SCORE_VIVO", true, 250, "client-1"
        ));

        assertThat(result.score()).isEqualByComparingTo("712.40");
        assertThat(result.outcome()).isEqualTo("APPROVE");
        assertThat(result.modelVersion()).isEqualTo("score-v3.2.1");
        assertThat(result.partial()).isFalse();
        assertThat(result.explanationRef()).startsWith("/api/v1/explain/");

        verify(wormStorage).put(eq(result.decisionId()), anyString());
        ArgumentCaptor<DecisionRepositoryPort.DecisionRecord> cap =
                ArgumentCaptor.forClass(DecisionRepositoryPort.DecisionRecord.class);
        verify(decisionRepo).save(cap.capture());
        assertThat(cap.getValue().sha256()).hasSize(64);
        assertThat(cap.getValue().storageUri()).isEqualTo("file:///data/worm/x.json");
        verify(recalculateScore, never()).execute(any());
        verify(explanationRepo).save(any());
        verify(counterfactualRepo).save(any());
    }

    @Test
    @DisplayName("CT-05 WORM fail → WormWriteException")
    void wormFailThrows() {
        when(scoreRepo.findCurrent("12345678901")).thenReturn(Optional.of(
                new ScoreRepositoryPort.CurrentScore(
                        "12345678901", new BigDecimal("600"), "3.1.0", Instant.now()
                )
        ));
        when(getFeatures.execute(any(), any(), any())).thenReturn(
                new GetFeaturesUseCase.FeaturesResult("12345678901", Instant.now(), true, Map.of())
        );
        when(decisionRepo.findLatestByDocumento("12345678901")).thenReturn(Optional.empty());
        when(wormStorage.put(any(), anyString()))
                .thenThrow(new WormWriteException("WORM forçado a falhar"));

        assertThatThrownBy(() -> service.execute(new CreateDecisionUseCase.Command(
                "12345678901", "SCORE_VIVO", false, 250, null
        ))).isInstanceOf(WormWriteException.class);

        verify(decisionRepo, never()).save(any());
    }

    @Test
    @DisplayName("CT-03 verify VALID")
    void verifyValid() {
        UUID id = UUID.randomUUID();
        String payload = "{\"decisionId\":\"" + id + "\",\"score\":700}";
        String sha = SnapshotHash.sha256Hex(payload);
        when(decisionRepo.findById(id)).thenReturn(Optional.of(
                new DecisionRepositoryPort.DecisionRecord(
                        id, "12345678901", new BigDecimal("700"), "3.1.0", "APPROVE",
                        sha, null, "file://x", Instant.now(), 10, List.of(), null,
                        false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
                )
        ));
        when(wormStorage.get(id)).thenReturn(Optional.of(payload));
        when(decisionRepo.findPreviousByDocumento(eq("12345678901"), any()))
                .thenReturn(Optional.empty());

        var result = verifyService.execute(id, true);

        assertThat(result.integrity()).isEqualTo("VALID");
        assertThat(result.chainValid()).isTrue();
        assertThat(result.sha256()).isEqualTo(sha);
    }

    @Test
    @DisplayName("CT-04 chain break detect → ChainBrokenException")
    void chainBreakDetect() {
        UUID id = UUID.randomUUID();
        String payload = "{\"decisionId\":\"" + id + "\"}";
        String sha = SnapshotHash.sha256Hex(payload);
        Instant created = Instant.now();
        when(decisionRepo.findById(id)).thenReturn(Optional.of(
                new DecisionRepositoryPort.DecisionRecord(
                        id, "12345678901", new BigDecimal("700"), "3.1.0", "APPROVE",
                        sha, "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
                        "file://x", created, 10, List.of(), null,
                        false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
                )
        ));
        when(wormStorage.get(id)).thenReturn(Optional.of(payload));
        when(decisionRepo.findPreviousByDocumento(eq("12345678901"), eq(created)))
                .thenReturn(Optional.of(
                        new DecisionRepositoryPort.DecisionRecord(
                                UUID.randomUUID(), "12345678901", new BigDecimal("690"), "3.0.0", "REVIEW",
                                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                null, "file://prev", created.minusSeconds(60), 8, List.of(), null,
                                false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
                        )
                ));

        assertThatThrownBy(() -> verifyService.execute(id, true))
                .isInstanceOf(ChainBrokenException.class);
    }

    @Test
    @DisplayName("Outcome stub: score 600 → REVIEW")
    void outcomeStubReview() {
        assertThat(CreateDecisionService.resolveOutcomeStub(new BigDecimal("600")))
                .isEqualTo("REVIEW");
        assertThat(CreateDecisionService.resolveOutcomeStub(new BigDecimal("700")))
                .isEqualTo("APPROVE");
        assertThat(CreateDecisionService.resolveOutcomeStub(new BigDecimal("499")))
                .isEqualTo("REJECT");
    }
}
