package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.audit.port.in.ExportAuditTrailUseCase;
import br.com.ebv.prisma.domain.audit.port.in.ListAuditTrailUseCase;
import br.com.ebv.prisma.presentation.dto.audit.ExportAuditRequest;
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

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
@Tag(name = "Audit", description = "PRISMA-EP-02-F04 Trilha de auditoria WORM")
public class AuditController {

    private final ListAuditTrailUseCase listAuditTrail;
    private final ExportAuditTrailUseCase exportAuditTrail;

    public AuditController(ListAuditTrailUseCase listAuditTrail, ExportAuditTrailUseCase exportAuditTrail) {
        this.listAuditTrail = listAuditTrail;
        this.exportAuditTrail = exportAuditTrail;
    }

    @GetMapping("/trail")
    @Operation(summary = "Pesquisa eventos da trilha")
    public Map<String, Object> trail(
            @RequestParam(required = false) String documento,
            @RequestParam(name = "actor_id", required = false) String actorId,
            @RequestParam(name = "event_type", required = false) String eventType,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return toPage(listAuditTrail.execute(new ListAuditTrailUseCase.Query(
                documento, actorId, eventType, from, to, page, size
        )));
    }

    @GetMapping("/trail/{documento}")
    @Operation(summary = "Eventos vinculados ao documento/titular")
    public Map<String, Object> trailByDocumento(
            @PathVariable String documento,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return toPage(listAuditTrail.execute(new ListAuditTrailUseCase.Query(
                documento, null, null, from, to, page, size
        )));
    }

    @PostMapping("/export")
    @Operation(summary = "Exporta recorte assíncrono com manifesto")
    public ResponseEntity<Map<String, Object>> export(@Valid @RequestBody ExportAuditRequest req) {
        var r = exportAuditTrail.execute(new ExportAuditTrailUseCase.Command(
                req.filters(), req.format(), req.purpose()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("export_id", r.exportId().toString());
        body.put("status", r.status());
        body.put("manifest_hash", r.manifestHash());
        body.put("retention_until", r.retentionUntil().toString());
        body.put("requested_at", r.requestedAt().toString());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
    }

    private static Map<String, Object> toPage(ListAuditTrailUseCase.Page result) {
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("event_id", i.id().toString());
            m.put("documento", i.documento());
            m.put("actor_id", i.actorId());
            m.put("event_type", i.eventType());
            m.put("sha256", i.sha256());
            m.put("prev_sha256", i.prevSha256());
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
}
