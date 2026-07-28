package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachJourneyUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class GetCoachJourneyService implements GetCoachJourneyUseCase {

    private final CoachRepositoryPort repo;

    public GetCoachJourneyService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new CoachValidationException("documento obrigatório");
        }
        String hash = sha256(query.documento().trim());
        var journey = repo.findActiveJourney(hash).orElseGet(() -> {
            UUID id = UUID.randomUUID();
            var created = new CoachRepositoryPort.JourneyRecord(id, hash, "ACTIVE", Instant.now(), null);
            repo.saveJourney(created);
            repo.saveGoal(new CoachRepositoryPort.GoalRecord(
                    UUID.randomUUID(), id, "PAY_ON_TIME", "Pague contas em dia",
                    "Estimativa: +20 a +40 pts em 90 dias", false, "SUGGESTED"
            ));
            return created;
        });
        List<Goal> goals = repo.findGoals(journey.journeyId()).stream()
                .map(g -> new Goal(g.goalId(), g.goalType(), g.title(), g.estimateText(), g.status()))
                .toList();
        return new Result(journey.journeyId(), journey.status(), goals);
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
