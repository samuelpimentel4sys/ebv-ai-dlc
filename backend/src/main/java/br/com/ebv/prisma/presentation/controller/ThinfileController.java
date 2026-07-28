package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.thinfile.port.in.CalculateThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.EvaluateThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileDriftUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileModelCardUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileScoreUseCase;
import br.com.ebv.prisma.presentation.dto.thinfile.CalculateThinfileScoreRequest;
import br.com.ebv.prisma.presentation.dto.thinfile.EvaluateMonitoringRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/thinfile")
@Tag(name = "Thin-File", description = "PRISMA-EP-06-F02/F09 Score thin-file + monitoring (lab — métricas stub / sem ONNX thin-file DoD)")
public class ThinfileController {

    private final CalculateThinfileScoreUseCase calculate;
    private final GetThinfileModelCardUseCase modelCard;
    private final GetThinfileScoreUseCase getScore;
    private final EvaluateThinfileMonitoringUseCase evaluate;
    private final GetThinfileMonitoringUseCase monitoring;
    private final GetThinfileDriftUseCase drift;

    public ThinfileController(
            CalculateThinfileScoreUseCase calculate,
            GetThinfileModelCardUseCase modelCard,
            GetThinfileScoreUseCase getScore,
            EvaluateThinfileMonitoringUseCase evaluate,
            GetThinfileMonitoringUseCase monitoring,
            GetThinfileDriftUseCase drift
    ) {
        this.calculate = calculate;
        this.modelCard = modelCard;
        this.getScore = getScore;
        this.evaluate = evaluate;
        this.monitoring = monitoring;
        this.drift = drift;
    }

    @PostMapping("/score")
    @Operation(summary = "Calcula score thin-file")
    public ResponseEntity<Map<String, Object>> score(@Valid @RequestBody CalculateThinfileScoreRequest req) {
        var r = calculate.execute(new CalculateThinfileScoreUseCase.Command(req.documento(), req.traditionalHistoryCount()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scoreId", r.scoreId().toString());
        body.put("scoreValue", r.scoreValue());
        body.put("confidenceBand", r.confidenceBand());
        body.put("thinFileFlag", r.thinFileFlag());
        body.put("routedToTraditional", r.routedToTraditional());
        body.put("modelVersion", r.modelVersion());
        body.put("partial", true);
        body.put("lab", true);
        body.put("scoringBackend", "formula-lab");
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/model-card")
    @Operation(summary = "Ficha do modelo thin-file")
    public Map<String, Object> modelCard() {
        var r = modelCard.execute();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("modelVersion", r.modelVersion());
        body.put("populationDesc", r.populationDesc());
        body.put("auc", r.auc());
        body.put("confidenceFloor", r.confidenceFloor());
        body.put("active", r.active());
        body.put("partial", true);
        body.put("lab", true);
        return body;
    }

    @GetMapping("/monitoring")
    @Operation(summary = "Painel de performance")
    public Map<String, Object> monitoring() {
        var r = monitoring.execute();
        List<Map<String, Object>> runs = r.runs().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("runId", i.runId().toString());
            m.put("modelVersion", i.modelVersion());
            m.put("status", i.status());
            m.put("aucCurrent", i.aucCurrent());
            m.put("degradationPct", i.degradationPct());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runs", runs);
        body.put("partial", true);
        body.put("lab", true);
        body.put("note", "métricas lab — não usar como DoD F09");
        return body;
    }

    @GetMapping("/drift")
    @Operation(summary = "Deriva de atributos")
    public Map<String, Object> drift() {
        var r = drift.execute();
        List<Map<String, Object>> metrics = r.metrics().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("featureName", i.featureName());
            m.put("psi", i.psi());
            m.put("severity", i.severity());
            m.put("vulnerableSegment", i.vulnerableSegment());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("metrics", metrics);
        body.put("partial", true);
        body.put("lab", true);
        return body;
    }

    @PostMapping("/monitoring/evaluate")
    @Operation(summary = "Apuração periódica de performance")
    public Map<String, Object> evaluate(@RequestBody(required = false) EvaluateMonitoringRequest req) {
        String version = req != null ? req.modelVersion() : null;
        var auc = req != null ? req.aucCurrent() : null;
        var r = evaluate.execute(new EvaluateThinfileMonitoringUseCase.Command(version, auc));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", r.runId().toString());
        body.put("status", r.status());
        body.put("degradationPct", r.degradationPct());
        body.put("actionTaken", r.actionTaken());
        body.put("partial", true);
        body.put("lab", true);
        return body;
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Consulta último score thin-file")
    public Map<String, Object> byDocumento(@PathVariable String documento) {
        var r = getScore.execute(new GetThinfileScoreUseCase.Query(documento));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scoreId", r.scoreId().toString());
        body.put("scoreValue", r.scoreValue());
        body.put("confidenceBand", r.confidenceBand());
        body.put("modelVersion", r.modelVersion());
        body.put("thinFileFlag", r.thinFileFlag());
        body.put("partial", true);
        body.put("lab", true);
        body.put("scoringBackend", "formula-lab");
        return body;
    }
}
