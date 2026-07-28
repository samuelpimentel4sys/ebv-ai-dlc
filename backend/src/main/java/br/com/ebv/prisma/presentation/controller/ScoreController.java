package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.scoring.port.in.GetScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.OnnxScorerPort;
import br.com.ebv.prisma.presentation.dto.scoring.RecalculateScoreRequest;
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

@RestController
@RequestMapping("/api/v1/score")
@Tag(name = "Score", description = "PRISMA-EP-04-F03 Score Vivo (partial=true se ONNX stub / fórmula lab)")
public class ScoreController {

    private final RecalculateScoreUseCase recalculate;
    private final GetScoreUseCase getScore;
    private final OnnxScorerPort onnxScorer;

    public ScoreController(
            RecalculateScoreUseCase recalculate,
            GetScoreUseCase getScore,
            OnnxScorerPort onnxScorer
    ) {
        this.recalculate = recalculate;
        this.getScore = getScore;
        this.onnxScorer = onnxScorer;
    }

    @PostMapping("/recalculate")
    @Operation(summary = "Recalcula score para o titular")
    public Map<String, Object> recalculate(@Valid @RequestBody RecalculateScoreRequest req) {
        var result = recalculate.execute(new RecalculateScoreUseCase.Command(
                req.documento(), req.reason(), req.critical()
        ));
        boolean onnxLive = onnxScorer.live();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("documento", result.documento());
        body.put("score", result.score());
        body.put("modelVersion", result.modelVersion());
        body.put("coalesced", result.coalesced());
        body.put("partial", !onnxLive);
        body.put("scoringBackend", onnxLive ? "onnx" : "formula-lab");
        body.put("lab", !onnxLive);
        return body;
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Score atual do titular")
    public Map<String, Object> getCurrent(@PathVariable String documento) {
        var summary = getScore.getCurrent(documento);
        boolean onnxLive = onnxScorer.live();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("documento", summary.documento());
        body.put("score", summary.score());
        body.put("modelVersion", summary.modelVersion());
        body.put("updatedAt", summary.updatedAt().toString());
        body.put("partial", !onnxLive);
        body.put("scoringBackend", onnxLive ? "onnx" : "formula-lab");
        body.put("lab", !onnxLive);
        return body;
    }

    @GetMapping("/{documento}/history")
    @Operation(summary = "Histórico de scores do titular")
    public Map<String, Object> getHistory(
            @PathVariable String documento,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var histPage = getScore.getHistory(documento, page, size);
        var items = histPage.items().stream()
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("score", e.score());
                    m.put("modelVersion", e.modelVersion());
                    m.put("reason", e.reason());
                    m.put("at", e.at().toString());
                    return m;
                })
                .toList();
        boolean onnxLive = onnxScorer.live();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("page", histPage.page());
        body.put("size", histPage.size());
        body.put("total", histPage.total());
        body.put("partial", !onnxLive);
        body.put("lab", !onnxLive);
        return body;
    }
}
