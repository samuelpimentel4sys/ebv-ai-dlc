package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.scoring.port.in.ListModelsUseCase;
import br.com.ebv.prisma.domain.scoring.port.in.PromoteModelUseCase;
import br.com.ebv.prisma.domain.scoring.port.in.RollbackModelUseCase;
import br.com.ebv.prisma.presentation.dto.scoring.PromoteModelRequest;
import br.com.ebv.prisma.presentation.dto.scoring.RollbackModelRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/models")
@Tag(name = "Model Registry", description = "PRISMA-EP-04-F09 Model Registry")
public class ModelController {

    private final ListModelsUseCase listModels;
    private final PromoteModelUseCase promoteModel;
    private final RollbackModelUseCase rollbackModel;

    public ModelController(
            ListModelsUseCase listModels,
            PromoteModelUseCase promoteModel,
            RollbackModelUseCase rollbackModel
    ) {
        this.listModels = listModels;
        this.promoteModel = promoteModel;
        this.rollbackModel = rollbackModel;
    }

    @GetMapping
    @Operation(summary = "Lista versões de modelos registradas")
    public List<Map<String, Object>> listAll() {
        return listModels.execute().stream()
                .map(m -> Map.<String, Object>of(
                        "modelId", m.modelId(),
                        "version", m.version(),
                        "stage", m.stage(),
                        "artifactUri", m.artifactUri(),
                        "metricsJson", m.metricsJson() != null ? m.metricsJson() : "",
                        "immutable", m.immutable(),
                        "createdAt", m.createdAt().toString()
                ))
                .toList();
    }

    @PostMapping("/{modelId}/promote")
    @Operation(summary = "Promove versão de modelo entre estágios")
    public Map<String, Object> promote(
            @PathVariable String modelId,
            @Valid @RequestBody PromoteModelRequest req
    ) {
        var result = promoteModel.execute(new PromoteModelUseCase.Command(
                modelId,
                req.version(),
                req.toStage(),
                req.canaryMetricsOk(),
                req.approverIds() != null ? req.approverIds() : List.of(),
                Boolean.TRUE.equals(req.emergency())
        ));
        return Map.of(
                "modelId", result.modelId(),
                "version", result.version(),
                "fromStage", result.fromStage(),
                "toStage", result.toStage(),
                "promotedAt", result.promotedAt().toString()
        );
    }

    @PostMapping("/{modelId}/rollback")
    @Operation(summary = "Reverte modelo para versão PRODUCTION anterior")
    public Map<String, Object> rollback(
            @PathVariable String modelId,
            @Valid @RequestBody RollbackModelRequest req
    ) {
        var result = rollbackModel.execute(new RollbackModelUseCase.Command(
                modelId,
                req.toVersion(),
                req.approverIds() != null ? req.approverIds() : List.of()
        ));
        return Map.of(
                "modelId", result.modelId(),
                "restoredVersion", result.restoredVersion(),
                "previousVersion", result.previousVersion() != null ? result.previousVersion() : ""
        );
    }
}
