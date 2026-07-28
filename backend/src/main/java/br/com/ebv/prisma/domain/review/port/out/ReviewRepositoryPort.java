package br.com.ebv.prisma.domain.review.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepositoryPort {

    record ReviewRecord(
            UUID id,
            UUID decisionId,
            String subjectToken,
            String reason,
            String channel,
            String status,
            String assignee,
            Instant dueAt,
            String outcome,
            String rationale,
            String reviewedFactorsJson,
            Instant createdAt,
            Instant decidedAt
    ) {}

    record PageResult(List<ReviewRecord> items, int page, int size, long totalElements, int totalPages) {}

    void save(ReviewRecord record);

    Optional<ReviewRecord> findById(UUID id);

    PageResult search(String status, String assignee, Instant dueBefore, int page, int size);
}
