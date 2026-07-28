package br.com.ebv.prisma.application.counterfactual;

import br.com.ebv.prisma.domain.counterfactual.exception.CounterfactualNotFoundException;
import br.com.ebv.prisma.domain.counterfactual.port.in.SimulateCounterfactualUseCase;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.counterfactual.port.out.CounterfactualRepositoryPort;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CounterfactualServiceTest {

    @Mock CounterfactualRepositoryPort counterfactualRepo;
    @Mock DecisionRepositoryPort decisionRepo;

    ObjectMapper mapper = new ObjectMapper();
    GetCounterfactualService getService;
    SimulateCounterfactualService simulateService;

    @BeforeEach
    void setUp() {
        getService = new GetCounterfactualService(counterfactualRepo, mapper);
        simulateService = new SimulateCounterfactualService(decisionRepo);
    }

    @Test
    @DisplayName("GET returns persisted REJECT actions ordered by effort")
    void getRejectActions() {
        UUID id = UUID.randomUUID();
        var actions = CounterfactualStubFactory.buildStubActions("REJECT");
        when(counterfactualRepo.findByDecisionId(id)).thenReturn(Optional.of(
                new CounterfactualRepositoryPort.CounterfactualRecord(
                        id, CounterfactualStubFactory.toJson(mapper, actions), Instant.now()
                )
        ));

        var r = getService.execute(id, 5);
        assertThat(r.viable()).isTrue();
        assertThat(r.actions()).isNotEmpty();
        assertThat(r.actions().getFirst().effort()).isLessThanOrEqualTo(r.actions().getLast().effort());
        assertThat(r.disclaimerVersion()).isEqualTo(CounterfactualStubFactory.DISCLAIMER);
    }

    @Test
    @DisplayName("simulate actionable changes can would_approve when score crosses 700")
    void simulateWouldApprove() {
        UUID id = UUID.randomUUID();
        when(decisionRepo.findById(id)).thenReturn(Optional.of(decision(id, "680")));

        var r = simulateService.execute(new SimulateCounterfactualUseCase.Command(
                id,
                List.of(new SimulateCounterfactualUseCase.Change("CREDIT_UTILIZATION", 0.4)),
                "MEDIUM_RISK"
        ));

        assertThat(r.wouldApprove()).isTrue();
        assertThat(r.estimatedScore()).isGreaterThanOrEqualTo(700);
    }

    @Test
    @DisplayName("missing counterfactual → 404")
    void missing404() {
        UUID id = UUID.randomUUID();
        when(counterfactualRepo.findByDecisionId(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> getService.execute(id, 3))
                .isInstanceOf(CounterfactualNotFoundException.class);
    }

    private static DecisionRepositoryPort.DecisionRecord decision(UUID id, String score) {
        return new DecisionRepositoryPort.DecisionRecord(
                id, "12345678901", new BigDecimal(score), "m1", "REJECT",
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                null, "file://x", Instant.now(), 10, List.of(), null,
                false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
        );
    }
}
