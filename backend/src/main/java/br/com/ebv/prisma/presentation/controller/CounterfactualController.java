package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.counterfactual.port.in.GetCounterfactualUseCase;
import br.com.ebv.prisma.domain.counterfactual.port.in.SimulateCounterfactualUseCase;
import br.com.ebv.prisma.presentation.dto.counterfactual.SimulateCounterfactualRequest;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/counterfactual")
@Tag(name = "Counterfactual", description = "PRISMA-EP-02-F02 Contrafactuais (DiCE stub)")
public class CounterfactualController {

    private final GetCounterfactualUseCase getCounterfactual;
    private final SimulateCounterfactualUseCase simulateCounterfactual;

    public CounterfactualController(
            GetCounterfactualUseCase getCounterfactual,
            SimulateCounterfactualUseCase simulateCounterfactual
    ) {
        this.getCounterfactual = getCounterfactual;
        this.simulateCounterfactual = simulateCounterfactual;
    }

    @GetMapping("/{decisionId}")
    @Operation(summary = "Obtém recomendações contrafactuais persistidas")
    public Map<String, Object> get(
            @PathVariable UUID decisionId,
            @RequestParam(name = "max_actions", defaultValue = "5") int maxActions
    ) {
        var r = getCounterfactual.execute(decisionId, maxActions);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decision_id", r.decisionId().toString());
        body.put("viable", r.viable());
        body.put("estimated_score_range", r.estimatedScoreRange());
        body.put("actions", r.actions().stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("attribute_code", a.attributeCode());
            m.put("from_value", a.fromValue());
            m.put("to_value", a.toValue());
            m.put("effort", a.effort());
            m.put("reason_code", a.reasonCode());
            m.put("action_text", a.actionText());
            m.put("effort_rank", a.effort());
            m.put("typical_effect_days", a.typicalEffectDays());
            return m;
        }).toList());
        body.put("disclaimer_version", r.disclaimerVersion());
        if (r.failureReason() != null) {
            body.put("failure_reason", r.failureReason());
        }
        return body;
    }

    @PostMapping("/simulate")
    @Operation(summary = "Simula alteração hipotética acionável")
    public Map<String, Object> simulate(@Valid @RequestBody SimulateCounterfactualRequest req) {
        List<SimulateCounterfactualUseCase.Change> changes = req.changes() == null ? List.of()
                : req.changes().stream()
                .map(c -> new SimulateCounterfactualUseCase.Change(c.attribute_code(), c.proposed_value()))
                .toList();
        var r = simulateCounterfactual.execute(new SimulateCounterfactualUseCase.Command(
                req.decision_id(), changes, req.target_band()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decision_id", r.decisionId().toString());
        body.put("target_band", r.targetBand());
        body.put("would_approve", r.wouldApprove());
        body.put("estimated_score", r.estimatedScore());
        body.put("disclaimer_version", r.disclaimerVersion());
        return body;
    }
}
