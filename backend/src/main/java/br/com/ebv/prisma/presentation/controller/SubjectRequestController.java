package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.subjectrequest.port.in.ListSubjectRequestsUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.in.OpenSubjectRequestUseCase;
import br.com.ebv.prisma.domain.subjectrequest.port.in.PatchSubjectRequestUseCase;
import br.com.ebv.prisma.presentation.dto.subjectrequest.OpenSubjectRequestRequest;
import br.com.ebv.prisma.presentation.dto.subjectrequest.PatchSubjectRequestRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subject-requests")
@Tag(name = "SubjectRequests", description = "PRISMA-EP-02-F08 Requisições LGPD Art.18")
public class SubjectRequestController {

    private final OpenSubjectRequestUseCase openRequest;
    private final ListSubjectRequestsUseCase listRequests;
    private final PatchSubjectRequestUseCase patchRequest;

    public SubjectRequestController(
            OpenSubjectRequestUseCase openRequest,
            ListSubjectRequestsUseCase listRequests,
            PatchSubjectRequestUseCase patchRequest
    ) {
        this.openRequest = openRequest;
        this.listRequests = listRequests;
        this.patchRequest = patchRequest;
    }

    @PostMapping
    @Operation(summary = "Registra exercício de direito")
    public ResponseEntity<Map<String, Object>> open(@Valid @RequestBody OpenSubjectRequestRequest req) {
        var r = openRequest.execute(new OpenSubjectRequestUseCase.Command(
                req.right_type(), req.subject_token(), req.channel(), req.description()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("request_id", r.requestId().toString());
        body.put("right_type", r.rightType());
        body.put("status", r.status());
        body.put("due_at", r.dueAt().toString());
        body.put("created_at", r.createdAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping
    @Operation(summary = "Lista fila por prazo e estado")
    public Map<String, Object> list(
            @RequestParam(required = false) String right_type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Instant due_before,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listRequests.execute(new ListSubjectRequestsUseCase.Query(
                right_type, status, due_before, page, size
        ));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("request_id", i.requestId().toString());
            m.put("right_type", i.rightType());
            m.put("subject_token", i.subjectToken());
            m.put("channel", i.channel());
            m.put("description", i.description());
            m.put("status", i.status());
            m.put("due_at", i.dueAt().toString());
            m.put("response_summary", i.responseSummary());
            m.put("created_at", i.createdAt().toString());
            m.put("updated_at", i.updatedAt().toString());
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

    @PatchMapping("/{id}")
    @Operation(summary = "Registra tratativa e resposta")
    public Map<String, Object> patch(
            @PathVariable UUID id,
            @Valid @RequestBody PatchSubjectRequestRequest req
    ) {
        var r = patchRequest.execute(new PatchSubjectRequestUseCase.Command(
                id, req.action(), req.response_summary(), req.attachment_id()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("request_id", r.requestId().toString());
        body.put("right_type", r.rightType());
        body.put("status", r.status());
        body.put("due_at", r.dueAt().toString());
        body.put("response_summary", r.responseSummary());
        body.put("attachment_id", r.attachmentId() != null ? r.attachmentId().toString() : null);
        body.put("updated_at", r.updatedAt().toString());
        return body;
    }
}
