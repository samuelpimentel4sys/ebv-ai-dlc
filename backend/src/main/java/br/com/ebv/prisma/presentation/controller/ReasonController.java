package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.reason.port.in.CreateReasonUseCase;
import br.com.ebv.prisma.domain.reason.port.in.ListReasonsUseCase;
import br.com.ebv.prisma.domain.reason.port.in.ResolveReasonsUseCase;
import br.com.ebv.prisma.presentation.dto.reason.CreateReasonRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reasons")
@Tag(name = "Reasons", description = "PRISMA-EP-02-F05 Catálogo e resolução de motivos")
public class ReasonController {

    private final ListReasonsUseCase listReasons;
    private final CreateReasonUseCase createReason;
    private final ResolveReasonsUseCase resolveReasons;

    public ReasonController(
            ListReasonsUseCase listReasons,
            CreateReasonUseCase createReason,
            ResolveReasonsUseCase resolveReasons
    ) {
        this.listReasons = listReasons;
        this.createReason = createReason;
        this.resolveReasons = resolveReasons;
    }

    @GetMapping
    @Operation(summary = "Lista versões do catálogo de motivos")
    public Map<String, Object> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String channel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listReasons.execute(new ListReasonsUseCase.Query(status, channel, page, size));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("reason_version_id", i.id().toString());
            m.put("code", i.code());
            m.put("version", i.version());
            m.put("status", i.status());
            m.put("consumer_text", i.consumerText());
            m.put("analyst_text", i.analystText());
            m.put("channels", i.channels());
            m.put("legal_approval", i.legalApproval());
            m.put("created_at", i.createdAt().toString());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("page", result.page());
        body.put("size", result.size());
        body.put("total_elements", result.totalElements());
        body.put("total_pages", result.totalPages());
        return body;
    }

    @PostMapping
    @Operation(summary = "Cria nova versão DRAFT de motivo")
    public ResponseEntity<Map<String, Object>> create(@Valid @RequestBody CreateReasonRequest req) {
        List<CreateReasonUseCase.Mapping> mappings = req.mappings() == null ? List.of() : req.mappings().stream()
                .map(m -> new CreateReasonUseCase.Mapping(m.attributeCode(), m.direction(), m.minimumMagnitude()))
                .toList();
        var r = createReason.execute(new CreateReasonUseCase.Command(
                req.code(), req.consumerText(), req.analystText(), req.channels(), mappings
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reason_version_id", r.reasonVersionId().toString());
        body.put("code", r.code());
        body.put("version", r.version());
        body.put("status", r.status());
        body.put("legal_approval", r.legalApproval());
        body.put("created_at", r.createdAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/resolve/{decisionId}")
    @Operation(summary = "Resolve motivos aprovados para uma decisão")
    public Map<String, Object> resolve(
            @PathVariable UUID decisionId,
            @RequestParam String channel
    ) {
        var r = resolveReasons.execute(decisionId, channel);
        List<Map<String, Object>> reasons = r.reasons().stream().map(h -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", h.code());
            m.put("version", h.version());
            m.put("text", h.text());
            m.put("channel", h.channel());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("decision_id", r.decisionId().toString());
        body.put("outcome", r.outcome());
        body.put("channel", r.channel());
        body.put("reasons", reasons);
        return body;
    }
}
