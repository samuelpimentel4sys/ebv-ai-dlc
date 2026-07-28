package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.pj.port.in.DecidePjOpinionUseCase;
import br.com.ebv.prisma.domain.pj.port.in.GetPjApprovalTrailUseCase;
import br.com.ebv.prisma.domain.pj.port.in.SubmitPjOpinionUseCase;
import br.com.ebv.prisma.infrastructure.config.LabActorResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pj/opinions")
@Tag(name = "PJ HITL", description = "PRISMA-EP-03-F04 Alçada — Java. GenAI via BFF mesmo host :8080")
public class PjHitlController {

    private final SubmitPjOpinionUseCase submit;
    private final DecidePjOpinionUseCase decide;
    private final GetPjApprovalTrailUseCase trail;
    private final LabActorResolver actors;

    public PjHitlController(
            SubmitPjOpinionUseCase submit,
            DecidePjOpinionUseCase decide,
            GetPjApprovalTrailUseCase trail,
            LabActorResolver actors
    ) {
        this.submit = submit;
        this.decide = decide;
        this.trail = trail;
        this.actors = actors;
    }

    public record SubmitRequest(UUID actorId, String comment) {}
    public record DecideRequest(
            @NotNull String decision,
            String comment,
            UUID actorId,
            String actorMaxLevel
    ) {}

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submete parecer para alçada (HITL Java — não é GenAI)")
    public ResponseEntity<Map<String, Object>> submit(
            @PathVariable UUID id,
            @RequestBody(required = false) SubmitRequest body,
            Authentication authentication
    ) {
        UUID actor = actors.resolve(body != null ? body.actorId() : null, authentication);
        String comment = body != null ? body.comment() : null;
        var r = submit.execute(new SubmitPjOpinionUseCase.Command(id, actor, comment));
        Map<String, Object> resp = new HashMap<>();
        resp.put("opinionId", r.opinionId());
        resp.put("status", r.status());
        resp.put("requiredLevel", r.requiredLevel());
        resp.put("trailId", r.trailId());
        resp.put("lab", true);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Aprova / rejeita / escala (HITL)")
    public ResponseEntity<Map<String, Object>> approve(
            @PathVariable UUID id,
            @Valid @RequestBody DecideRequest body,
            Authentication authentication
    ) {
        UUID actor = actors.resolve(body.actorId(), authentication);
        String maxLevel = body.actorMaxLevel() != null ? body.actorMaxLevel() : "L2";
        var r = decide.execute(new DecidePjOpinionUseCase.Command(
                id, actor, body.decision(), body.comment(), maxLevel
        ));
        Map<String, Object> resp = new HashMap<>();
        resp.put("opinionId", r.opinionId());
        resp.put("status", r.status());
        resp.put("levelCode", r.levelCode());
        resp.put("approvedAt", r.decidedAt());
        resp.put("trailEntryId", r.trailEntryId());
        resp.put("lab", true);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/trail")
    @Operation(summary = "Trilha append-only de aprovação")
    public ResponseEntity<Map<String, Object>> trail(@PathVariable UUID id) {
        var r = trail.execute(new GetPjApprovalTrailUseCase.Query(id));
        List<Map<String, Object>> items = r.trail().stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.id());
            m.put("action", t.action());
            m.put("actorId", t.actorId());
            m.put("levelCode", t.levelCode());
            m.put("comment", t.comment());
            m.put("at", t.at());
            return m;
        }).toList();
        Map<String, Object> body = new HashMap<>();
        body.put("opinionId", r.opinionId());
        body.put("trail", items);
        body.put("lab", true);
        return ResponseEntity.ok(body);
    }
}
