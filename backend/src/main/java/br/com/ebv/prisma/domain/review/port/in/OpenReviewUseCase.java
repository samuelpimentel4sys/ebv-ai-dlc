package br.com.ebv.prisma.domain.review.port.in;

import java.time.Instant;
import java.util.UUID;

public interface OpenReviewUseCase {

    record Command(UUID decisionId, String subjectToken, String reason, String channel) {}

    record Result(UUID reviewId, UUID decisionId, String status, Instant dueAt, Instant createdAt) {}

    Result execute(Command command);
}
