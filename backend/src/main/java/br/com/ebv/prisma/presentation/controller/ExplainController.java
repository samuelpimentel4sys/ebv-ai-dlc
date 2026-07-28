package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.explain.port.in.BatchExplainUseCase;
import br.com.ebv.prisma.domain.explain.port.in.GetExplainFactorsUseCase;
import br.com.ebv.prisma.domain.explain.port.in.GetExplanationUseCase;
import br.com.ebv.prisma.presentation.dto.explain.BatchExplainRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/explain")
@Tag(name = "Explain", description = "PRISMA-EP-02-F01 Explicabilidade SHAP (stub)")
public class ExplainController {

    private final GetExplanationUseCase getExplanation;
    private final BatchExplainUseCase batchExplain;
    private final GetExplainFactorsUseCase getFactors;

    public ExplainController(
            GetExplanationUseCase getExplanation,
            BatchExplainUseCase batchExplain,
            GetExplainFactorsUseCase getFactors
    ) {
        this.getExplanation = getExplanation;
        this.batchExplain = batchExplain;
        this.getFactors = getFactors;
    }

    @GetMapping("/{decisionId}")
    @Operation(summary = "Obtém snapshot explicativo persistido")
    public Map<String, Object> get(
            @PathVariable UUID decisionId,
            @RequestParam(name = "includeLabels", defaultValue = "false") boolean includeLabels
    ) {
        return toExplainBody(getExplanation.execute(decisionId, includeLabels));
    }

    @PostMapping("/batch")
    @Operation(summary = "Consulta explicações em lote (máx. 100)")
    public Map<String, Object> batch(@Valid @RequestBody BatchExplainRequest req) {
        var result = batchExplain.execute(new BatchExplainUseCase.Command(
                req.decision_ids(), req.include_factors()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", result.items().stream().map(this::toExplainBody).toList());
        body.put("missing_ids", result.missingIds().stream().map(UUID::toString).toList());
        body.put("total", result.items().size());
        return body;
    }

    @GetMapping("/{decisionId}/factors")
    @Operation(summary = "Lista fatores ordenados por magnitude")
    public Map<String, Object> factors(
            @PathVariable UUID decisionId,
            @RequestParam String direction,
            @RequestParam(defaultValue = "10") int limit
    ) {
        var r = getFactors.execute(decisionId, direction, limit);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decision_id", r.decisionId().toString());
        body.put("direction", r.direction());
        body.put("limit", r.limit());
        body.put("items", r.items().stream().map(this::toFactorBody).toList());
        return body;
    }

    private Map<String, Object> toExplainBody(GetExplanationUseCase.Result r) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decision_id", r.decisionId().toString());
        body.put("model_version", r.modelVersion());
        body.put("policy_version", r.policyVersion());
        body.put("base_value", r.baseValue());
        body.put("score", r.score());
        body.put("snapshot_hash", r.snapshotHash());
        body.put("factors", r.factors().stream().map(this::toFactorBody).toList());
        body.put("generated_at", r.generatedAt().toString());
        return body;
    }

    private Map<String, Object> toFactorBody(GetExplanationUseCase.Factor f) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("attribute_code", f.attributeCode());
        if (f.businessLabel() != null) {
            m.put("business_label", f.businessLabel());
        }
        m.put("value", f.value());
        m.put("shap_value", f.shapValue());
        m.put("direction", f.direction());
        return m;
    }
}
