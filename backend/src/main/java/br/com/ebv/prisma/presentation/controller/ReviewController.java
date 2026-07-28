package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.review.port.in.DecideReviewUseCase;
import br.com.ebv.prisma.domain.review.port.in.ListReviewQueueUseCase;
import br.com.ebv.prisma.domain.review.port.in.OpenReviewUseCase;
import br.com.ebv.prisma.presentation.dto.review.DecideReviewRequest;
import br.com.ebv.prisma.presentation.dto.review.OpenReviewRequest;
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
@RequestMapping("/api/v1/reviews")
@Tag(name = "Reviews", description = "PRISMA-EP-02-F06 Ciclo de vida da revisão humana")
public class ReviewController {

    private final OpenReviewUseCase openReview;
    private final ListReviewQueueUseCase listQueue;
    private final DecideReviewUseCase decideReview;

    public ReviewController(
            OpenReviewUseCase openReview,
            ListReviewQueueUseCase listQueue,
            DecideReviewUseCase decideReview
    ) {
        this.openReview = openReview;
        this.listQueue = listQueue;
        this.decideReview = decideReview;
    }

    @PostMapping
    @Operation(summary = "Abre revisão humana de decisão")
    public ResponseEntity<Map<String, Object>> open(@Valid @RequestBody OpenReviewRequest req) {
        var r = openReview.execute(new OpenReviewUseCase.Command(
                req.decision_id(), req.subject_token(), req.reason(), req.channel()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reviewId", r.reviewId().toString());
        body.put("review_id", r.reviewId().toString());
        body.put("decision_id", r.decisionId().toString());
        body.put("status", r.status());
        body.put("dueAt", r.dueAt().toString());
        body.put("due_at", r.dueAt().toString());
        body.put("created_at", r.createdAt().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/queue")
    @Operation(summary = "Lista fila de revisão priorizada por vencimento")
    public Map<String, Object> queue(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) Instant due_before,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var result = listQueue.execute(new ListReviewQueueUseCase.Query(status, assignee, due_before, page, size));
        List<Map<String, Object>> items = result.items().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("review_id", i.reviewId().toString());
            m.put("decision_id", i.decisionId().toString());
            m.put("subject_token", i.subjectToken());
            m.put("reason", i.reason());
            m.put("channel", i.channel());
            m.put("status", i.status());
            m.put("assignee", i.assignee());
            m.put("due_at", i.dueAt().toString());
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

    @PatchMapping("/{reviewId}/decide")
    @Operation(summary = "Registra desfecho fundamentado")
    public Map<String, Object> decide(
            @PathVariable UUID reviewId,
            @Valid @RequestBody DecideReviewRequest req
    ) {
        var r = decideReview.execute(new DecideReviewUseCase.Command(
                reviewId, req.outcome(), req.rationale(), req.reviewed_factors()
        ));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("review_id", r.reviewId().toString());
        body.put("status", r.status());
        body.put("outcome", r.outcome());
        body.put("decided_at", r.decidedAt().toString());
        return body;
    }
}
