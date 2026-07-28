package br.com.ebv.prisma.application.reason;

import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.reason.exception.ReasonValidationException;
import br.com.ebv.prisma.domain.reason.port.in.CreateReasonUseCase;
import br.com.ebv.prisma.domain.reason.port.in.ResolveReasonsUseCase;
import br.com.ebv.prisma.domain.reason.port.out.ReasonVersionRepositoryPort;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReasonServiceTest {

    @Mock ReasonVersionRepositoryPort reasonRepo;
    @Mock DecisionRepositoryPort decisionRepo;

    CreateReasonService createService;
    ResolveReasonsService resolveService;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper();
        createService = new CreateReasonService(reasonRepo, mapper);
        resolveService = new ResolveReasonsService(decisionRepo, reasonRepo);
    }

    @Test
    @DisplayName("CT-01 create → DRAFT")
    void createDraft() {
        when(reasonRepo.findMaxVersion("UTILIZATION_HIGH")).thenReturn(Optional.of(1));

        var result = createService.execute(new CreateReasonUseCase.Command(
                "UTILIZATION_HIGH",
                "texto consumidor",
                "texto analista",
                List.of("APP"),
                List.of(new CreateReasonUseCase.Mapping("UTILIZATION_90D", "NEGATIVE", 0.18))
        ));

        assertThat(result.status()).isEqualTo("DRAFT");
        assertThat(result.version()).isEqualTo(2);
        ArgumentCaptor<ReasonVersionRepositoryPort.ReasonVersionRecord> cap =
                ArgumentCaptor.forClass(ReasonVersionRepositoryPort.ReasonVersionRecord.class);
        verify(reasonRepo).save(cap.capture());
        assertThat(cap.getValue().legalApproval()).isNull();
    }

    @Test
    @DisplayName("resolve APPROVE → empty reasons")
    void resolveApproveEmpty() {
        UUID id = UUID.randomUUID();
        when(decisionRepo.findById(id)).thenReturn(Optional.of(decision(id, "APPROVE")));

        ResolveReasonsUseCase.Result r = resolveService.execute(id, "APP");
        assertThat(r.reasons()).isEmpty();
    }

    @Test
    @DisplayName("resolve REJECT → catalog APPROVED")
    void resolveRejectCatalog() {
        UUID id = UUID.randomUUID();
        when(decisionRepo.findById(id)).thenReturn(Optional.of(decision(id, "REJECT")));
        when(reasonRepo.findApprovedForChannel("APP")).thenReturn(List.of(
                new ReasonVersionRepositoryPort.ReasonVersionRecord(
                        UUID.randomUUID(), "UTILIZATION_HIGH", 1, "APPROVED",
                        "uso elevado", "utilização alta", "[\"APP\"]", "[]", "LEGAL-1", Instant.now()
                )
        ));

        ResolveReasonsUseCase.Result r = resolveService.execute(id, "APP");
        assertThat(r.reasons()).hasSize(1);
        assertThat(r.reasons().getFirst().code()).isEqualTo("UTILIZATION_HIGH");
    }

    @Test
    @DisplayName("decisão inexistente → 404")
    void decisionMissing() {
        UUID id = UUID.randomUUID();
        when(decisionRepo.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> resolveService.execute(id, "APP"))
                .isInstanceOf(DecisionNotFoundException.class);
    }

    @Test
    @DisplayName("canal inválido → 422")
    void badChannel() {
        assertThatThrownBy(() -> resolveService.execute(UUID.randomUUID(), "SMS"))
                .isInstanceOf(ReasonValidationException.class);
    }

    private static DecisionRepositoryPort.DecisionRecord decision(UUID id, String outcome) {
        return new DecisionRepositoryPort.DecisionRecord(
                id, "12345678901", new BigDecimal("400"), "v1", outcome,
                "abc", null, "uri", Instant.now(), 10, List.of(), "client",
                false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
        );
    }
}
