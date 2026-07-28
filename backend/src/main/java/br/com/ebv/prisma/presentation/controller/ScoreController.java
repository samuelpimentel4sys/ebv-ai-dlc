package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.scoring.port.in.GetScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
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
@Tag(name = "Score", description = "PRISMA-EP-04-F03 Score Vivo")
public class ScoreController {

    private final RecalculateScoreUseCase recalculate;
    private final GetScoreUseCase getScore;

    public ScoreController(RecalculateScoreUseCase recalculate, GetScoreUseCase getScore) {
        this.recalculate = recalculate;
        this.getScore = getScore;
    }

    @PostMapping("/recalculate")
    @Operation(summary = "Recalcula score para o titular")
    public Map<String, Object> recalculate(@Valid @RequestBody RecalculateScoreRequest req) {
        var result = recalculate.execute(new RecalculateScoreUseCase.Command(
                req.documento(), req.reason(), req.critical()
        ));
        return Map.of(
                "documento", result.documento(),
                "score", result.score(),
                "modelVersion", result.modelVersion(),
                "coalesced", result.coalesced()
        );
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Score atual do titular")
    public Map<String, Object> getCurrent(@PathVariable String documento) {
        var summary = getScore.getCurrent(documento);
        return Map.of(
                "documento", summary.documento(),
                "score", summary.score(),
                "modelVersion", summary.modelVersion(),
                "updatedAt", summary.updatedAt().toString()
        );
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
        return Map.of(
                "items", items,
                "page", histPage.page(),
                "size", histPage.size(),
                "total", histPage.total()
        );
    }
}
