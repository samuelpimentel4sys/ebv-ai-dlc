package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.policysim.port.in.GetPolicyBaselineUseCase;
import br.com.ebv.prisma.domain.policysim.port.in.GetPolicySimulationUseCase;
import br.com.ebv.prisma.domain.policysim.port.in.SimulatePolicyUseCase;
import br.com.ebv.prisma.presentation.dto.policysim.SimulatePolicyRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/policy")
@Tag(name = "PolicySimulate", description = "PRISMA-EP-02-F09 Simulação isolada de política (Spark stub)")
public class PolicySimulateController {

    private final SimulatePolicyUseCase simulatePolicy;
    private final GetPolicySimulationUseCase getSimulation;
    private final GetPolicyBaselineUseCase getBaseline;
    private final ObjectMapper objectMapper;

    public PolicySimulateController(
            SimulatePolicyUseCase simulatePolicy,
            GetPolicySimulationUseCase getSimulation,
            GetPolicyBaselineUseCase getBaseline,
            ObjectMapper objectMapper
    ) {
        this.simulatePolicy = simulatePolicy;
        this.getSimulation = getSimulation;
        this.getBaseline = getBaseline;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/simulate")
    @Operation(summary = "Agenda simulação isolada (sandbox stub sync)")
    public ResponseEntity<Map<String, Object>> simulate(@Valid @RequestBody SimulatePolicyRequest req) {
        var r = simulatePolicy.execute(new SimulatePolicyUseCase.Command(
                req.candidate_policy(), req.sample_ref(), req.metrics()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("simulation_id", r.simulationId().toString());
        body.put("status", r.status());
        body.put("baseline_version", r.baselineVersion());
        body.put("sample_ref", r.sampleRef());
        body.put("submitted_at", r.submittedAt().toString());
        body.put("finished_at", r.finishedAt() != null ? r.finishedAt().toString() : null);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/simulations/{id}")
    @Operation(summary = "Consulta progresso e indicadores da simulação")
    public Map<String, Object> get(@PathVariable UUID id) {
        var r = getSimulation.execute(id);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("simulation_id", r.simulationId().toString());
        body.put("status", r.status());
        body.put("sample_ref", r.sampleRef());
        body.put("baseline_version", r.baselineVersion());
        body.put("candidate_policy", parseJson(r.candidatePolicyJson()));
        body.put("metrics", parseJson(r.metricsJson()));
        body.put("result", parseJson(r.resultJson()));
        body.put("created_at", r.createdAt().toString());
        body.put("finished_at", r.finishedAt() != null ? r.finishedAt().toString() : null);
        return body;
    }

    @GetMapping("/baseline")
    @Operation(summary = "Obtém baseline vigente")
    public Map<String, Object> baseline(
            @RequestParam(required = false) String portfolio,
            @RequestParam(required = false) LocalDate as_of_date
    ) {
        var r = getBaseline.execute(new GetPolicyBaselineUseCase.Query(portfolio, as_of_date));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("baseline_version", r.baselineVersion());
        body.put("status", r.status());
        body.put("portfolio", r.portfolio());
        body.put("as_of_date", r.asOfDate().toString());
        body.put("artifact_hash", r.artifactHash());
        body.put("stub", r.stub());
        return body;
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Object>() {});
        } catch (Exception e) {
            return json;
        }
    }
}
