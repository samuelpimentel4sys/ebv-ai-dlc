package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.dispute.port.in.GetDisputeTimelineUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.GetDisputeTrackingUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.GetEvidencePackUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ListDisputeAttachmentsUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ListDisputeQueueUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.OpenDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.ResolveDisputeUseCase;
import br.com.ebv.prisma.domain.dispute.port.in.UploadDisputeAttachmentUseCase;
import br.com.ebv.prisma.presentation.dto.dispute.AttachmentJsonRequest;
import br.com.ebv.prisma.presentation.dto.dispute.OpenDisputeRequest;
import br.com.ebv.prisma.presentation.dto.dispute.ResolveDisputeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/disputes")
@Tag(name = "Disputes", description = "PRISMA-EP-05 F01/F02/F08 Contestação")
public class DisputeController {

    private final OpenDisputeUseCase openDispute;
    private final ListDisputeQueueUseCase listQueue;
    private final ResolveDisputeUseCase resolveDispute;
    private final GetDisputeTrackingUseCase tracking;
    private final GetDisputeTimelineUseCase timeline;
    private final UploadDisputeAttachmentUseCase uploadAttachment;
    private final ListDisputeAttachmentsUseCase listAttachments;
    private final GetEvidencePackUseCase evidencePack;

    public DisputeController(
            OpenDisputeUseCase openDispute,
            ListDisputeQueueUseCase listQueue,
            ResolveDisputeUseCase resolveDispute,
            GetDisputeTrackingUseCase tracking,
            GetDisputeTimelineUseCase timeline,
            UploadDisputeAttachmentUseCase uploadAttachment,
            ListDisputeAttachmentsUseCase listAttachments,
            GetEvidencePackUseCase evidencePack
    ) {
        this.openDispute = openDispute;
        this.listQueue = listQueue;
        this.resolveDispute = resolveDispute;
        this.tracking = tracking;
        this.timeline = timeline;
        this.uploadAttachment = uploadAttachment;
        this.listAttachments = listAttachments;
        this.evidencePack = evidencePack;
    }

    @PostMapping
    @Operation(summary = "Abre contestação e inicia SLA lab")
    public ResponseEntity<Map<String, Object>> open(@Valid @RequestBody OpenDisputeRequest req) {
        var r = openDispute.execute(new OpenDisputeUseCase.Command(
                req.documento(), req.reason_code(), req.description(), req.channel(), req.record_ref()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("protocol", r.protocol());
        body.put("status", r.status());
        body.put("dueAt", r.dueAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/queue")
    @Operation(summary = "Fila operacional ordenada por due_at")
    public Map<String, Object> queue(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listQueue.execute(new ListDisputeQueueUseCase.Query(page, size));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", i.id().toString());
            m.put("protocol", i.protocol());
            m.put("documento", i.documento());
            m.put("status", i.status());
            m.put("dueAt", i.dueAt() != null ? i.dueAt().toString() : null);
            m.put("createdAt", i.createdAt().toString());
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

    @PatchMapping("/{id}/resolve")
    @Operation(summary = "Registra desfecho fundamentado")
    public Map<String, Object> resolve(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveDisputeRequest req
    ) {
        var r = resolveDispute.execute(new ResolveDisputeUseCase.Command(id, req.outcome(), req.rationale()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("protocol", r.protocol());
        body.put("status", r.status());
        body.put("outcome", r.outcome());
        body.put("resolvedAt", r.resolvedAt().toString());
        return body;
    }

    @GetMapping("/{protocol}/tracking")
    @Operation(summary = "Tracking e-commerce da contestação")
    public Map<String, Object> tracking(
            @PathVariable String protocol,
            @RequestParam(required = false) String confirmDocumento
    ) {
        var r = tracking.execute(new GetDisputeTrackingUseCase.Query(protocol, confirmDocumento));
        List<Map<String, Object>> preview = r.timelinePreview().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("eventType", p.eventType());
            m.put("occurredAt", p.occurredAt().toString());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("protocol", r.protocol());
        body.put("stage", r.stage());
        body.put("status", r.status());
        body.put("slaDueAt", r.slaDueAt() != null ? r.slaDueAt().toString() : null);
        body.put("daysRemaining", r.daysRemaining());
        body.put("nextAction", r.nextAction());
        body.put("nextActor", r.nextActor());
        body.put("timelinePreview", preview);
        return body;
    }

    @GetMapping("/{protocol}/timeline")
    @Operation(summary = "Linha do tempo completa")
    public Map<String, Object> timeline(
            @PathVariable String protocol,
            @RequestParam(required = false) String confirmDocumento
    ) {
        var events = timeline.execute(new GetDisputeTimelineUseCase.Query(protocol, confirmDocumento));
        List<Map<String, Object>> items = events.stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("eventType", e.eventType());
            m.put("message", e.message());
            m.put("actor", e.actor());
            m.put("at", e.at().toString());
            return m;
        }).toList();
        return Map.of("protocol", protocol, "events", items);
    }

    @PostMapping(path = "/{id}/attachments", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Upload anexo JSON base64")
    public ResponseEntity<Map<String, Object>> uploadJson(
            @PathVariable UUID id,
            @Valid @RequestBody AttachmentJsonRequest req
    ) {
        byte[] content = Base64.getDecoder().decode(req.contentBase64());
        UUID prev = req.prevAttachmentId() == null || req.prevAttachmentId().isBlank()
                ? null : UUID.fromString(req.prevAttachmentId());
        var r = uploadAttachment.execute(new UploadDisputeAttachmentUseCase.Command(
                id, req.filename(), req.contentType(), content, prev
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(attachmentBody(r));
    }

    @PostMapping(path = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload anexo multipart")
    public ResponseEntity<Map<String, Object>> uploadMultipart(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String prevAttachmentId
    ) throws Exception {
        UUID prev = prevAttachmentId == null || prevAttachmentId.isBlank()
                ? null : UUID.fromString(prevAttachmentId);
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        var r = uploadAttachment.execute(new UploadDisputeAttachmentUseCase.Command(
                id, file.getOriginalFilename(), contentType, file.getBytes(), prev
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(attachmentBody(r));
    }

    @GetMapping("/{id}/attachments")
    @Operation(summary = "Lista metadados de anexos")
    public Map<String, Object> listAttachments(@PathVariable UUID id) {
        List<Map<String, Object>> items = listAttachments.execute(
                new ListDisputeAttachmentsUseCase.Query(id)
        ).stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.id().toString());
            m.put("filename", a.filename());
            m.put("contentType", a.contentType());
            m.put("sha256", a.sha256());
            m.put("prevAttachmentId", a.prevAttachmentId() != null ? a.prevAttachmentId().toString() : null);
            m.put("createdAt", a.createdAt().toString());
            return m;
        }).toList();
        return Map.of("items", items);
    }

    @GetMapping("/{id}/evidence-pack")
    @Operation(summary = "Pacote de evidências + manifesto hash")
    public Map<String, Object> evidencePack(@PathVariable UUID id) {
        var r = evidencePack.execute(new GetEvidencePackUseCase.Query(id));
        List<Map<String, Object>> files = r.files().stream().map(f -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", f.id().toString());
            m.put("filename", f.filename());
            m.put("contentType", f.contentType());
            m.put("sha256", f.sha256());
            m.put("storageUri", f.storageUri());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("manifestHash", r.manifestHash());
        body.put("files", files);
        return body;
    }

    private static Map<String, Object> attachmentBody(UploadDisputeAttachmentUseCase.Result r) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", r.id().toString());
        body.put("filename", r.filename());
        body.put("contentType", r.contentType());
        body.put("sha256", r.sha256());
        body.put("status", r.status());
        body.put("uploadedAt", r.uploadedAt().toString());
        return body;
    }
}
