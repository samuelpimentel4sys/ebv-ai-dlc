package br.com.ebv.prisma.application.review;

import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.review.exception.ReviewConflictException;
import br.com.ebv.prisma.domain.review.port.in.DecideReviewUseCase;
import br.com.ebv.prisma.domain.review.port.in.OpenReviewUseCase;
import br.com.ebv.prisma.domain.review.port.out.ReviewRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock DecisionRepositoryPort decisionRepo;
    @Mock ReviewRepositoryPort reviewRepo;

    ObjectMapper mapper = new ObjectMapper();
    OpenReviewService openService;
    DecideReviewService decideService;

    @BeforeEach
    void setUp() {
        openService = new OpenReviewService(decisionRepo, reviewRepo);
        decideService = new DecideReviewService(reviewRepo, mapper);
    }

    @Test
    @DisplayName("open review → OPEN + due_at = now+15d")
    void openCreatesReview() {
        UUID decisionId = UUID.randomUUID();
        when(decisionRepo.findById(decisionId)).thenReturn(Optional.of(decision(decisionId)));

        Instant before = Instant.now();
        var r = openService.execute(new OpenReviewUseCase.Command(
                decisionId, "tok-sub", "Contestação art.20", "PORTAL"
        ));

        assertThat(r.status()).isEqualTo("OPEN");
        assertThat(r.dueAt()).isAfter(before.plus(14, ChronoUnit.DAYS));
        assertThat(r.dueAt()).isBefore(before.plus(16, ChronoUnit.DAYS));
        verify(reviewRepo).save(any());
    }

    @Test
    @DisplayName("decide already DECIDED → conflict 409")
    void decideAlreadyDecided409() {
        UUID reviewId = UUID.randomUUID();
        when(reviewRepo.findById(reviewId)).thenReturn(Optional.of(new ReviewRepositoryPort.ReviewRecord(
                reviewId, UUID.randomUUID(), "tok", "reason", "PORTAL", "DECIDED",
                null, Instant.now().plus(10, ChronoUnit.DAYS), "MAINTAIN", "ok", "[]",
                Instant.now(), Instant.now()
        )));

        assertThatThrownBy(() -> decideService.execute(new DecideReviewUseCase.Command(
                reviewId, "REFORM", "novo doc", List.of("DEBT_STATUS")
        ))).isInstanceOf(ReviewConflictException.class);
    }

    @Test
    @DisplayName("decide OPEN → DECIDED")
    void decideOpenOk() {
        UUID reviewId = UUID.randomUUID();
        UUID decisionId = UUID.randomUUID();
        Instant created = Instant.now().minus(1, ChronoUnit.HOURS);
        when(reviewRepo.findById(reviewId)).thenReturn(Optional.of(new ReviewRepositoryPort.ReviewRecord(
                reviewId, decisionId, "tok", "reason", "PORTAL", "OPEN",
                null, Instant.now().plus(14, ChronoUnit.DAYS), null, null, null, created, null
        )));

        var r = decideService.execute(new DecideReviewUseCase.Command(
                reviewId, "REFORM", "Documento comprova quitação", List.of("DEBT_STATUS")
        ));

        assertThat(r.status()).isEqualTo("DECIDED");
        assertThat(r.outcome()).isEqualTo("REFORM");

        ArgumentCaptor<ReviewRepositoryPort.ReviewRecord> cap =
                ArgumentCaptor.forClass(ReviewRepositoryPort.ReviewRecord.class);
        verify(reviewRepo).save(cap.capture());
        assertThat(cap.getValue().status()).isEqualTo("DECIDED");
        assertThat(cap.getValue().rationale()).contains("quitação");
    }

    private static DecisionRepositoryPort.DecisionRecord decision(UUID id) {
        return new DecisionRepositoryPort.DecisionRecord(
                id, "12345678901", new BigDecimal("480"), "m1", "REJECT",
                "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
                null, "file://worm/x", Instant.now(), 12, List.of(), "client",
                false, "SCORE_VIVO", null, LocalDate.now().plusYears(5)
        );
    }
}
