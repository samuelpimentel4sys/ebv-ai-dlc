package br.com.ebv.prisma.application.policysim;

import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import br.com.ebv.prisma.domain.policysim.port.in.GetPolicyBaselineUseCase;
import br.com.ebv.prisma.domain.policysim.port.in.SimulatePolicyUseCase;
import br.com.ebv.prisma.domain.policysim.port.out.PolicySimulationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PolicySimServiceTest {

    @Mock PolicySimulationRepositoryPort simulationRepo;
    @Mock PolicyVersionRepositoryPort policyVersionRepo;

    SimulatePolicyService simulateService;
    GetPolicyBaselineService baselineService;

    @BeforeEach
    void setUp() {
        simulateService = new SimulatePolicyService(simulationRepo, policyVersionRepo, new ObjectMapper());
        baselineService = new GetPolicyBaselineService(policyVersionRepo);
    }

    @Test
    @DisplayName("simulate → DONE sandbox stub with approve_rate vs baseline, no prod writes")
    void simulateSandboxDone() {
        when(policyVersionRepo.search(eq("PUBLISHED"), isNull(), isNull(), isNull(), anyInt(), anyInt()))
                .thenReturn(new PolicyVersionRepositoryPort.PageResult(List.of(), 0, 1, 0, 0));

        var r = simulateService.execute(new SimulatePolicyUseCase.Command(
                Map.of("base_version", "POL-2026.07.3", "changes", List.of(Map.of("rule", "MIN_SCORE", "from", 580, "to", 600))),
                "HIST-2026-Q2-STRATIFIED",
                List.of("APPROVAL_RATE")
        ));

        assertThat(r.status()).isEqualTo("DONE");
        assertThat(r.baselineVersion()).isEqualTo(SimulatePolicyService.STUB_BASELINE);

        ArgumentCaptor<PolicySimulationRepositoryPort.SimulationRecord> cap =
                ArgumentCaptor.forClass(PolicySimulationRepositoryPort.SimulationRecord.class);
        verify(simulationRepo).save(cap.capture());
        assertThat(cap.getValue().resultJson()).contains("\"prod_writes\":false");
        assertThat(cap.getValue().resultJson()).contains("candidate_approve_rate");
        assertThat(cap.getValue().resultJson()).contains("SANDBOX");
    }

    @Test
    @DisplayName("baseline without published → static stub")
    void baselineStub() {
        when(policyVersionRepo.search(eq("PUBLISHED"), isNull(), isNull(), isNull(), anyInt(), anyInt()))
                .thenReturn(new PolicyVersionRepositoryPort.PageResult(List.of(), 0, 1, 0, 0));

        var r = baselineService.execute(new GetPolicyBaselineUseCase.Query("PF", null));
        assertThat(r.stub()).isTrue();
        assertThat(r.baselineVersion()).isEqualTo(GetPolicyBaselineService.STUB_VERSION);
        assertThat(r.portfolio()).isEqualTo("PF");
    }

    @Test
    @DisplayName("baseline from latest PUBLISHED policy")
    void baselineFromPublished() {
        var published = new PolicyVersionRepositoryPort.PolicyVersionRecord(
                java.util.UUID.randomUUID(), "POL-2026.07.3", "PUBLISHED",
                "{}", "sha256:abc", "author", "appr-1", Instant.now(),
                "note", "commit", Instant.now(), Instant.now(), true
        );
        when(policyVersionRepo.search(eq("PUBLISHED"), isNull(), isNull(), isNull(), anyInt(), anyInt()))
                .thenReturn(new PolicyVersionRepositoryPort.PageResult(List.of(published), 0, 1, 1, 1));

        var r = baselineService.execute(new GetPolicyBaselineUseCase.Query("DEFAULT", null));
        assertThat(r.stub()).isFalse();
        assertThat(r.baselineVersion()).isEqualTo("POL-2026.07.3");
        assertThat(r.artifactHash()).isEqualTo("sha256:abc");
    }
}
