package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.decision.port.in.CreateDecisionUseCase;
import br.com.ebv.prisma.domain.decision.port.in.GetBudgetUseCase;
import br.com.ebv.prisma.domain.decision.port.in.GetDecisionUseCase;
import br.com.ebv.prisma.domain.decision.port.in.GetSnapshotUseCase;
import br.com.ebv.prisma.domain.decision.port.in.VerifyDecisionUseCase;
import br.com.ebv.prisma.presentation.dto.decision.CreateDecisionRequest;
import br.com.ebv.prisma.presentation.dto.decision.VerifyDecisionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/decisions")
@Tag(name = "Decisions", description = "PRISMA-EP-01-F04 WORM + F05 Decisão síncrona")
public class DecisionController {

    private final CreateDecisionUseCase createDecision;
    private final GetDecisionUseCase getDecision;
    private final GetSnapshotUseCase getSnapshot;
    private final VerifyDecisionUseCase verifyDecision;
    private final GetBudgetUseCase getBudget;

    public DecisionController(
            CreateDecisionUseCase createDecision,
            GetDecisionUseCase getDecision,
            GetSnapshotUseCase getSnapshot,
            VerifyDecisionUseCase verifyDecision,
            GetBudgetUseCase getBudget
    ) {
        this.createDecision = createDecision;
        this.getDecision = getDecision;
        this.getSnapshot = getSnapshot;
        this.verifyDecision = verifyDecision;
        this.getBudget = getBudget;
    }

    @PostMapping
    @Operation(summary = "Decisão de crédito síncrona (F05)")
    public Map<String, Object> create(
            @Valid @RequestBody CreateDecisionRequest req,
            @RequestHeader(value = "X-Budget-Ms", required = false, defaultValue = "250") int budgetMs,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId
    ) {
        var result = createDecision.execute(new CreateDecisionUseCase.Command(
                req.documento(),
                req.productCode(),
                req.includeExplanationOrDefault(),
                budgetMs,
                clientId
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decisionId", result.decisionId().toString());
        body.put("score", result.score());
        body.put("outcome", result.outcome());
        body.put("modelVersion", result.modelVersion());
        body.put("latencyMs", result.latencyMs());
        body.put("partial", result.partial());
        body.put("degradedFlags", result.degradedFlags());
        body.put("explanationRef", result.explanationRef());
        return body;
    }

    @GetMapping("/budget")
    @Operation(summary = "Orçamento de latência (F05)")
    public Map<String, Object> budget() {
        var info = getBudget.execute();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("defaultBudgetMs", info.defaultBudgetMs());
        body.put("slices", info.slices());
        return body;
    }

    @GetMapping("/{decisionId}")
    @Operation(summary = "Metadados da decisão (F04/F05)")
    public Map<String, Object> get(@PathVariable UUID decisionId) {
        var d = getDecision.execute(decisionId);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decisionId", d.decisionId().toString());
        body.put("documento", d.documento());
        body.put("score", d.score());
        body.put("outcome", d.outcome());
        body.put("modelVersion", d.modelVersion());
        body.put("sha256", d.sha256());
        body.put("prevSha256", d.prevSha256());
        body.put("storageUri", d.storageUri());
        body.put("createdAt", d.createdAt().toString());
        body.put("latencyMs", d.latencyMs());
        body.put("partial", d.partial());
        body.put("degradedFlags", d.degradedFlags());
        body.put("productCode", d.productCode());
        body.put("explanationRef", d.explanationRef());
        body.put("lockedUntil", d.lockedUntil() != null ? d.lockedUntil().toString() : null);
        body.put("clientId", d.clientId());
        return body;
    }

    @GetMapping("/{decisionId}/snapshot")
    @Operation(summary = "Payload imutável completo (F04)")
    public Map<String, Object> snapshot(@PathVariable UUID decisionId) {
        return getSnapshot.execute(decisionId);
    }

    @PostMapping("/{decisionId}/verify")
    @Operation(summary = "Verifica integridade/cadeia SHA-256 (F04)")
    public Map<String, Object> verify(
            @PathVariable UUID decisionId,
            @RequestBody(required = false) VerifyDecisionRequest req
    ) {
        boolean checkChain = req == null || req.checkChainOrDefault();
        var result = verifyDecision.execute(decisionId, checkChain);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decisionId", result.decisionId().toString());
        body.put("integrity", result.integrity());
        body.put("chainValid", result.chainValid());
        body.put("sha256", result.sha256());
        body.put("lockedUntil", result.lockedUntil() != null ? result.lockedUntil().toString() : null);
        return body;
    }

    /** RN004: sem update in-place — PUT/PATCH snapshot → 405 */
    @PutMapping("/{decisionId}/snapshot")
    public ResponseEntity<Void> putSnapshotForbidden(@PathVariable UUID decisionId) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }

    @PatchMapping("/{decisionId}/snapshot")
    public ResponseEntity<Void> patchSnapshotForbidden(@PathVariable UUID decisionId) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }
}
