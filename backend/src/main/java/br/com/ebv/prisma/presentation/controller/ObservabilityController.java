package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.observability.port.in.GetDecisionTraceUseCase;
import br.com.ebv.prisma.domain.observability.port.in.GetErrorBudgetUseCase;
import br.com.ebv.prisma.domain.observability.port.in.GetSloUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/observability")
@Tag(name = "Observability SLO", description = "PRISMA-EP-01-F08 Telemetria SLO")
public class ObservabilityController {

    private final GetSloUseCase getSlo;
    private final GetDecisionTraceUseCase getDecisionTrace;
    private final GetErrorBudgetUseCase getErrorBudget;

    public ObservabilityController(
            GetSloUseCase getSlo,
            GetDecisionTraceUseCase getDecisionTrace,
            GetErrorBudgetUseCase getErrorBudget
    ) {
        this.getSlo = getSlo;
        this.getDecisionTrace = getDecisionTrace;
        this.getErrorBudget = getErrorBudget;
    }

    @GetMapping("/slo")
    @Operation(summary = "SLO p95/p99 e compliance")
    public Map<String, Object> slo(
            @RequestParam(defaultValue = "1h") String window,
            @RequestParam(required = false) String clientId
    ) {
        var r = getSlo.execute(window, clientId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("window", r.window());
        body.put("clientId", r.clientId());
        body.put("targetP95Ms", r.targetP95Ms());
        body.put("p95Ms", r.p95Ms());
        body.put("p99Ms", r.p99Ms());
        body.put("compliance", r.compliance());
        body.put("errorBudgetRemainingPct", r.errorBudgetRemainingPct());
        return body;
    }

    @GetMapping("/traces/{decisionId}")
    @Operation(summary = "Trace correlacionado por decisionId")
    public Map<String, Object> trace(
            @PathVariable UUID decisionId,
            @RequestParam(required = false) String clientId
    ) {
        var r = getDecisionTrace.execute(decisionId, clientId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decisionId", r.decisionId().toString());
        body.put("clientId", r.clientId());
        body.put("spans", r.spans());
        body.put("createdAt", r.createdAt().toString());
        body.put("expiresAt", r.expiresAt().toString());
        return body;
    }

    @GetMapping("/budget")
    @Operation(summary = "Error budget restante (janela 24h)")
    public Map<String, Object> budget(@RequestParam(required = false) String clientId) {
        var r = getErrorBudget.execute(clientId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("errorBudgetRemainingPct", r.errorBudgetRemainingPct());
        body.put("burnAlert", r.burnAlert());
        return body;
    }
}
