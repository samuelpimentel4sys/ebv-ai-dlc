package br.com.ebv.prisma.application.review;

import br.com.ebv.prisma.domain.decision.exception.DecisionNotFoundException;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.review.port.in.OpenReviewUseCase;
import br.com.ebv.prisma.domain.review.port.out.ReviewRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class OpenReviewService implements OpenReviewUseCase {

    public static final String STATUS_OPEN = "OPEN";
    public static final int DUE_DAYS_STUB = 15;

    private final DecisionRepositoryPort decisionRepo;
    private final ReviewRepositoryPort reviewRepo;

    public OpenReviewService(DecisionRepositoryPort decisionRepo, ReviewRepositoryPort reviewRepo) {
        this.decisionRepo = decisionRepo;
        this.reviewRepo = reviewRepo;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.decisionId() == null) {
            throw new IllegalArgumentException("decision_id obrigatório");
        }
        if (command.subjectToken() == null || command.subjectToken().isBlank()) {
            throw new IllegalArgumentException("subject_token obrigatório");
        }
        if (command.reason() == null || command.reason().isBlank()) {
            throw new IllegalArgumentException("reason obrigatório");
        }
        if (command.channel() == null || command.channel().isBlank()) {
            throw new IllegalArgumentException("channel obrigatório");
        }

        decisionRepo.findById(command.decisionId())
                .orElseThrow(() -> new DecisionNotFoundException(command.decisionId()));

        UUID reviewId = UUID.randomUUID();
        Instant now = Instant.now();
        Instant dueAt = now.plus(DUE_DAYS_STUB, ChronoUnit.DAYS);

        reviewRepo.save(new ReviewRepositoryPort.ReviewRecord(
                reviewId,
                command.decisionId(),
                command.subjectToken().trim(),
                command.reason().trim(),
                command.channel().trim().toUpperCase(),
                STATUS_OPEN,
                null,
                dueAt,
                null,
                null,
                null,
                now,
                null
        ));

        return new Result(reviewId, command.decisionId(), STATUS_OPEN, dueAt, now);
    }
}
