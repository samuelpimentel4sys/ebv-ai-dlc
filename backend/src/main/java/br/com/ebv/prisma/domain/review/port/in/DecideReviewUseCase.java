package br.com.ebv.prisma.domain.review.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface DecideReviewUseCase {

    record Command(UUID reviewId, String outcome, String rationale, List<String> reviewedFactors) {}

    record Result(
            UUID reviewId,
            String status,
            String outcome,
            Instant decidedAt
    ) {}

    Result execute(Command command);
}
