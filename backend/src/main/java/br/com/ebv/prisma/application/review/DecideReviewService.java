package br.com.ebv.prisma.application.review;

import br.com.ebv.prisma.domain.review.exception.ReviewConflictException;
import br.com.ebv.prisma.domain.review.exception.ReviewNotFoundException;
import br.com.ebv.prisma.domain.review.exception.ReviewValidationException;
import br.com.ebv.prisma.domain.review.port.in.DecideReviewUseCase;
import br.com.ebv.prisma.domain.review.port.out.ReviewRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class DecideReviewService implements DecideReviewUseCase {

    public static final String STATUS_OPEN = "OPEN";
    public static final String STATUS_IN_REVIEW = "IN_REVIEW";
    public static final String STATUS_DECIDED = "DECIDED";
    private static final Set<String> DECIDABLE = Set.of(STATUS_OPEN, STATUS_IN_REVIEW);
    private static final Set<String> OUTCOMES = Set.of("MAINTAIN", "REFORM");

    private final ReviewRepositoryPort reviewRepo;
    private final ObjectMapper objectMapper;

    public DecideReviewService(ReviewRepositoryPort reviewRepo, ObjectMapper objectMapper) {
        this.reviewRepo = reviewRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.reviewId() == null) {
            throw new IllegalArgumentException("reviewId obrigatório");
        }
        if (command.outcome() == null || command.outcome().isBlank()) {
            throw new ReviewValidationException("outcome obrigatório");
        }
        if (command.rationale() == null || command.rationale().isBlank()) {
            throw new ReviewValidationException("rationale obrigatório");
        }

        String outcome = command.outcome().trim().toUpperCase(Locale.ROOT);
        if (!OUTCOMES.contains(outcome)) {
            throw new ReviewValidationException("outcome deve ser MAINTAIN ou REFORM");
        }

        var existing = reviewRepo.findById(command.reviewId())
                .orElseThrow(() -> new ReviewNotFoundException(command.reviewId()));

        if (STATUS_DECIDED.equals(existing.status())) {
            throw new ReviewConflictException("Revisão já decidida: " + command.reviewId());
        }
        if (!DECIDABLE.contains(existing.status())) {
            throw new ReviewConflictException("Revisão não permite decisão no status " + existing.status());
        }

        List<String> factors = command.reviewedFactors() == null ? List.of() : command.reviewedFactors();
        Instant now = Instant.now();
        String factorsJson;
        try {
            factorsJson = objectMapper.writeValueAsString(factors);
        } catch (Exception e) {
            throw new IllegalStateException("Falha serialização reviewed_factors", e);
        }

        reviewRepo.save(new ReviewRepositoryPort.ReviewRecord(
                existing.id(),
                existing.decisionId(),
                existing.subjectToken(),
                existing.reason(),
                existing.channel(),
                STATUS_DECIDED,
                existing.assignee(),
                existing.dueAt(),
                outcome,
                command.rationale().trim(),
                factorsJson,
                existing.createdAt(),
                now
        ));

        return new Result(existing.id(), STATUS_DECIDED, outcome, now);
    }
}
