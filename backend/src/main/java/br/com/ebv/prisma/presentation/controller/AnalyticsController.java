package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.analytics.port.in.GetBaselineUseCase;
import br.com.ebv.prisma.domain.analytics.port.in.GetDeflectionUseCase;
import br.com.ebv.prisma.domain.analytics.port.in.GetSacCostUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "PRISMA-EP-05-F09 Desvio e economia SAC")
public class AnalyticsController {

    private final GetDeflectionUseCase deflection;
    private final GetSacCostUseCase sacCost;
    private final GetBaselineUseCase baseline;

    public AnalyticsController(
            GetDeflectionUseCase deflection,
            GetSacCostUseCase sacCost,
            GetBaselineUseCase baseline
    ) {
        this.deflection = deflection;
        this.sacCost = sacCost;
        this.baseline = baseline;
    }

    @GetMapping("/deflection")
    @Operation(summary = "Taxa de desvio self-service")
    public Map<String, Object> deflection(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        var r = deflection.execute(new GetDeflectionUseCase.Query(from, to));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", r.from().toString());
        body.put("to", r.to().toString());
        body.put("deflectionRate", r.deflectionRate());
        body.put("deflectedCases", r.deflectedCases());
        body.put("totalCases", r.totalCases());
        body.put("reclassified48h", r.reclassified48h());
        body.put("baselineDeflectionRate", r.baselineDeflectionRate());
        body.put("deltaPp", r.deltaPp());
        return body;
    }

    @GetMapping("/sac-cost")
    @Operation(summary = "Custo médio SAC por canal")
    public Map<String, Object> sacCost(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        var r = sacCost.execute(new GetSacCostUseCase.Query(from, to));
        List<Map<String, Object>> channels = r.channels().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("channel", c.channel());
            m.put("avgCost", c.avgCost());
            m.put("currency", c.currency());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", r.from().toString());
        body.put("to", r.to().toString());
        body.put("channels", channels);
        return body;
    }

    @GetMapping("/baseline")
    @Operation(summary = "Linha de base do projeto")
    public Map<String, Object> baseline() {
        var r = baseline.execute();
        List<Map<String, Object>> items = r.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("metricKey", i.metricKey());
            m.put("channel", i.channel());
            m.put("value", i.value());
            m.put("periodFrom", i.periodFrom().toString());
            m.put("periodTo", i.periodTo().toString());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("label", r.label());
        body.put("items", items);
        return body;
    }
}
