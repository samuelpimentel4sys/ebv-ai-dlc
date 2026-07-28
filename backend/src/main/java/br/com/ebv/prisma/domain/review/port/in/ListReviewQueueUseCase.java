package br.com.ebv.prisma.domain.review.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListReviewQueueUseCase {

    record Query(String status, String assignee, Instant dueBefore, int page, int size) {}

    record Item(
            UUID reviewId,
            UUID decisionId,
            String subjectToken,
            String reason,
            String channel,
            String status,
            String assignee,
            Instant dueAt,
            Instant createdAt
    ) {}

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
