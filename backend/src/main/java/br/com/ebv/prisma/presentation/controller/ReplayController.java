package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.replay.port.in.AbortReplayJobUseCase;
import br.com.ebv.prisma.domain.replay.port.in.CreateReplayJobUseCase;
import br.com.ebv.prisma.domain.replay.port.in.GetReplayJobUseCase;
import br.com.ebv.prisma.presentation.dto.replay.CreateReplayJobRequest;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/replay/jobs")
@Tag(name = "Replay", description = "PRISMA-EP-01-F10 Replay histórico isolado")
public class ReplayController {

    private final CreateReplayJobUseCase createReplayJob;
    private final GetReplayJobUseCase getReplayJob;
    private final AbortReplayJobUseCase abortReplayJob;

    public ReplayController(
            CreateReplayJobUseCase createReplayJob,
            GetReplayJobUseCase getReplayJob,
            AbortReplayJobUseCase abortReplayJob
    ) {
        this.createReplayJob = createReplayJob;
        this.getReplayJob = getReplayJob;
        this.abortReplayJob = abortReplayJob;
    }

    @PostMapping
    @Operation(summary = "Cria job de replay sandbox")
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CreateReplayJobRequest req) {
        var result = createReplayJob.execute(new CreateReplayJobUseCase.Command(
                req.windowStart(),
                req.windowEnd(),
                req.targetEnv(),
                req.approverId(),
                req.justification(),
                null
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", result.jobId().toString());
        body.put("status", result.status());
        body.put("targetEnv", result.targetEnv());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Status do job de replay")
    public Map<String, Object> get(@PathVariable UUID jobId) {
        var r = getReplayJob.execute(jobId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", r.jobId().toString());
        body.put("windowStart", r.windowStart().toString());
        body.put("windowEnd", r.windowEnd().toString());
        body.put("status", r.status());
        body.put("targetEnv", r.targetEnv());
        body.put("outputUri", r.outputUri());
        body.put("justification", r.justification());
        body.put("createdAt", r.createdAt().toString());
        body.put("finishedAt", r.finishedAt() != null ? r.finishedAt().toString() : null);
        return body;
    }

    @PostMapping("/{jobId}/abort")
    @Operation(summary = "Aborta job de replay")
    public Map<String, Object> abort(@PathVariable UUID jobId) {
        var r = abortReplayJob.execute(jobId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("jobId", r.jobId().toString());
        body.put("status", r.status());
        return body;
    }
}
