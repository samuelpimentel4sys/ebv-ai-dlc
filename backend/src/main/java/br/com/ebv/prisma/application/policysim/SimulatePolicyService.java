package br.com.ebv.prisma.application.policysim;

import br.com.ebv.prisma.domain.policy.port.out.PolicyVersionRepositoryPort;
import br.com.ebv.prisma.domain.policysim.exception.PolicySimulationValidationException;
import br.com.ebv.prisma.domain.policysim.port.in.SimulatePolicyUseCase;
import br.com.ebv.prisma.domain.policysim.port.out.PolicySimulationRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SimulatePolicyService implements SimulatePolicyUseCase {

    public static final String STATUS_SANDBOX = "SANDBOX";
    public static final String STATUS_DONE = "DONE";
    public static final String STUB_BASELINE = "POL-LAB-BASELINE";
    /** Lab stub rates — never write prod decisions. */
    public static final BigDecimal BASELINE_APPROVE_RATE = new BigDecimal("0.4200");
    public static final BigDecimal CANDIDATE_APPROVE_RATE = new BigDecimal("0.3850");

    private final PolicySimulationRepositoryPort simulationRepo;
    private final PolicyVersionRepositoryPort policyVersionRepo;
    private final ObjectMapper objectMapper;

    public SimulatePolicyService(
            PolicySimulationRepositoryPort simulationRepo,
            PolicyVersionRepositoryPort policyVersionRepo,
            ObjectMapper objectMapper
    ) {
        this.simulationRepo = simulationRepo;
        this.policyVersionRepo = policyVersionRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.candidatePolicy() == null || command.candidatePolicy().isEmpty()) {
            throw new PolicySimulationValidationException("candidate_policy obrigatório");
        }
        if (command.sampleRef() == null || command.sampleRef().isBlank()) {
            throw new PolicySimulationValidationException("sample_ref obrigatório");
        }

        List<String> metrics = command.metrics() == null || command.metrics().isEmpty()
                ? List.of("APPROVAL_RATE") : command.metrics();

        String baselineVersion = policyVersionRepo.search("PUBLISHED", null, null, null, 0, 1)
                .items().stream()
                .findFirst()
                .map(PolicyVersionRepositoryPort.PolicyVersionRecord::version)
                .orElse(STUB_BASELINE);

        UUID id = UUID.randomUUID();
        Instant now = Instant.now();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("environment", STATUS_SANDBOX);
        result.put("baseline_version", baselineVersion);
        result.put("baseline_approve_rate", BASELINE_APPROVE_RATE);
        result.put("candidate_approve_rate", CANDIDATE_APPROVE_RATE);
        result.put("delta_approve_rate", CANDIDATE_APPROVE_RATE.subtract(BASELINE_APPROVE_RATE));
        result.put("prod_writes", false);
        result.put("metrics", metrics);

        String candidateJson = toJson(command.candidatePolicy());
        String metricsJson = toJson(metrics);
        String resultJson = toJson(result);

        simulationRepo.save(new PolicySimulationRepositoryPort.SimulationRecord(
                id, candidateJson, command.sampleRef().trim(), STATUS_DONE,
                metricsJson, resultJson, baselineVersion, now, now
        ));

        return new Result(id, STATUS_DONE, baselineVersion, command.sampleRef().trim(), now, now);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Falha serialização simulação", e);
        }
    }
}
