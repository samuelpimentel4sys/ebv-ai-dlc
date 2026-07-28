package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.fairness.port.in.AnalyzeFairnessUseCase;
import br.com.ebv.prisma.domain.fairness.port.in.ListFairnessAlertsUseCase;
import br.com.ebv.prisma.domain.fairness.port.in.ListFairnessMetricsUseCase;
import br.com.ebv.prisma.presentation.dto.fairness.AnalyzeFairnessRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fairness")
@Tag(name = "Fairness", description = "PRISMA-EP-02-F07 Apuração periódica de equidade (Fairlearn stub)")
public class FairnessController {

    private final ListFairnessMetricsUseCase listMetrics;
    private final ListFairnessAlertsUseCase listAlerts;
    private final AnalyzeFairnessUseCase analyzeFairness;

    public FairnessController(
            ListFairnessMetricsUseCase listMetrics,
            ListFairnessAlertsUseCase listAlerts,
            AnalyzeFairnessUseCase analyzeFairness
    ) {
        this.listMetrics = listMetrics;
        this.listAlerts = listAlerts;
        this.analyzeFairness = analyzeFairness;
    }

    @GetMapping("/metrics")
    @Operation(summary = "Consulta métricas de equidade")
    public Map<String, Object> metrics(
            @RequestParam(required = false) String model_version,
            @RequestParam(required = false) String metric,
            @RequestParam(required = false) String segment,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listMetrics.execute(new ListFairnessMetricsUseCase.Query(
                model_version, metric, segment, from, to, page, size
        ));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("metric_id", i.metricId().toString());
            m.put("run_id", i.runId() != null ? i.runId().toString() : null);
            m.put("model_version", i.modelVersion());
            m.put("metric_name", i.metricName());
            m.put("segment_name", i.segmentName());
            m.put("group_code", i.groupCode());
            m.put("metric_value", i.metricValue());
            m.put("approved_limit", i.approvedLimit());
            m.put("exceeded", i.exceeded());
            m.put("created_at", i.createdAt().toString());
            return m;
        }).toList();
        return pageBody(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }

    @GetMapping("/alerts")
    @Operation(summary = "Lista alertas de disparidade")
    public Map<String, Object> alerts(
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String model_version,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listAlerts.execute(new ListFairnessAlertsUseCase.Query(
                severity, status, model_version, page, size
        ));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("alert_id", i.alertId().toString());
            m.put("metric_id", i.metricId() != null ? i.metricId().toString() : null);
            m.put("model_version", i.modelVersion());
            m.put("severity", i.severity());
            m.put("status", i.status());
            m.put("message", i.message());
            m.put("opened_at", i.openedAt().toString());
            return m;
        }).toList();
        return pageBody(items, result.page(), result.size(), result.totalElements(), result.totalPages());
    }

    @PostMapping("/analyze")
    @Operation(summary = "Executa apuração governada (stub sync)")
    public ResponseEntity<Map<String, Object>> analyze(@Valid @RequestBody AnalyzeFairnessRequest req) {
        var r = analyzeFairness.execute(new AnalyzeFairnessUseCase.Command(
                req.model_version(),
                new AnalyzeFairnessUseCase.Window(req.window().from(), req.window().to()),
                req.segments(),
                req.metrics(),
                req.threshold_profile()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("run_id", r.runId().toString());
        body.put("status", r.status());
        body.put("model_version", r.modelVersion());
        body.put("threshold_profile", r.thresholdProfile());
        body.put("submitted_at", r.submittedAt().toString());
        body.put("finished_at", r.finishedAt() != null ? r.finishedAt().toString() : null);
        body.put("alert_opened", r.alertOpened());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    private static Map<String, Object> pageBody(
            List<Map<String, Object>> items, int page, int size, long totalElements, int totalPages
    ) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("page", page);
        body.put("size", size);
        body.put("total_elements", totalElements);
        body.put("total_pages", totalPages);
        return body;
    }
}
