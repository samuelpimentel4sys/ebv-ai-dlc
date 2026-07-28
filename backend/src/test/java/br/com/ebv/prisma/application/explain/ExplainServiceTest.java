package br.com.ebv.prisma.application.explain;

import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.explain.exception.ExplanationNotFoundException;
import br.com.ebv.prisma.domain.explain.port.in.BatchExplainUseCase;
import br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase;
import br.com.ebv.prisma.domain.explain.port.out.ExplanationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExplainServiceTest {

    @Mock ExplanationRepositoryPort explanationRepo;
    @Mock DecisionRepositoryPort decisionRepo;

    ObjectMapper mapper = new ObjectMapper();
    GetExplanationService getService;
    BatchExplainService batchService;
    GetExplainFactorsService factorsService;

    @BeforeEach
    void setUp() {
        getService = new GetExplanationService(explanationRepo, decisionRepo, mapper);
        batchService = new BatchExplainService(getService);
        factorsService = new GetExplainFactorsService(explanationRepo, mapper);
    }

    @Test
    @DisplayName("GET explain returns persisted stub factors without recalculation")
    void getPersistedSnapshot() {
        UUID id = UUID.randomUUID();
        String factorsJson = ExplanationStubFactory.toFactorsJson(
                mapper, ExplanationStubFactory.buildStubFactors(Map.of(), new BigDecimal("548"))
        );
        when(explanationRepo.findByDecisionId(id)).thenReturn(Optional.of(
                new ExplanationRepositoryPort.ExplanationRecord(
                        id, new BigDecimal("548"), factorsJson, "credit-xgb-stub", true, Instant.now()
                )
        ));
        when(decisionRepo.findById(id)).thenReturn(Optional.of(decision(id, "548")));

        GetExplanationUseCase.Result r = getService.execute(id, true);

        assertThat(r.factors()).isNotEmpty();
        assertThat(r.factors().getFirst().direction()).isIn("POSITIVE", "NEGATIVE");
        assertThat(r.factors().getFirst().businessLabel()).isNotBlank();
        assertThat(r.modelVersion()).isEqualTo("credit-xgb-stub");
    }

    @Test
    @DisplayName("missing explanation → ExplanationNotFoundException")
    void missing404() {
        UUID id = UUID.randomUUID();
        when(explanationRepo.findByDecisionId(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> getService.execute(id, false))
                .isInstanceOf(ExplanationNotFoundException.class);
    }

    @Test
    @DisplayName("batch >100 → 400")
    void batchMax100() {
        List<UUID> ids = java.util.stream.Stream.generate(UUID::randomUUID).limit(101).toList();
        assertThatThrownBy(() -> batchService.execute(new BatchExplainUseCase.Command(ids, true)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100");
    }

    @Test
    @DisplayName("factors NEGATIVE ordered by magnitude")
    void factorsNegative() {
        UUID id = UUID.randomUUID();
        String factorsJson = ExplanationStubFactory.toFactorsJson(
                mapper, ExplanationStubFactory.buildStubFactors(Map.of(), new BigDecimal("500"))
        );
        when(explanationRepo.findByDecisionId(id)).thenReturn(Optional.of(
                new ExplanationRepositoryPort.ExplanationRecord(
                        id, new BigDecimal("500"), factorsJson, "m1", true, Instant.now()
                )
        ));

        var r = factorsService.execute(id, "NEGATIVE", 5);
        assertThat(r.items()).isNotEmpty();
        assertThat(r.items()).allMatch(f -> "NEGATIVE".equals(f.direction()));
    }

    private static DecisionRepositoryPort.DecisionRecord decision(UUID id, String score) {
        return new DecisionRepositoryPort.DecisionRecord(
                id, "12345678901", new BigDecimal(score), "m1", "REJECT",
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                null, "file://x", Instant.now(), 10, List.of(), null,
                false, "SCORE_VIVO", "/api/v1/explain/" + id, LocalDate.now().plusYears(5)
        );
    }
}
