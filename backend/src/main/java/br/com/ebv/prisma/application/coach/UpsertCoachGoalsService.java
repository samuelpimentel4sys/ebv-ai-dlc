package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.UpsertCoachGoalsUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UpsertCoachGoalsService implements UpsertCoachGoalsUseCase {

    private final CoachRepositoryPort repo;

    public UpsertCoachGoalsService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.goals() == null || command.goals().isEmpty()) {
            throw new CoachValidationException("documento e goals obrigatórios");
        }
        for (GoalInput g : command.goals()) {
            if (Boolean.TRUE.equals(g.guaranteesApproval())) {
                throw new CoachValidationException("texto com garantia de aprovação bloqueado (RN-01)");
            }
            String text = (g.title() != null ? g.title() : "") + " " + (g.estimateText() != null ? g.estimateText() : "");
            if (text.toLowerCase().contains("garantia de aprovação") || text.toLowerCase().contains("aprovação garantida")) {
                throw new CoachValidationException("texto com garantia de aprovação bloqueado (RN-01)");
            }
        }
        String hash = GetCoachJourneyService.sha256(command.documento().trim());
        var journey = repo.findActiveJourney(hash).orElseGet(() -> {
            UUID id = UUID.randomUUID();
            var created = new CoachRepositoryPort.JourneyRecord(id, hash, "ACTIVE", Instant.now(), null);
            repo.saveJourney(created);
            return created;
        });
        List<Item> out = new ArrayList<>();
        for (GoalInput g : command.goals()) {
            UUID gid = UUID.randomUUID();
            repo.saveGoal(new CoachRepositoryPort.GoalRecord(
                    gid, journey.journeyId(),
                    g.goalType() != null ? g.goalType() : "CUSTOM",
                    g.title(), g.estimateText() != null ? g.estimateText() : "",
                    false, "ACTIVE"
            ));
            out.add(new Item(gid, g.title(), "ACTIVE"));
        }
        return new Result(journey.journeyId(), out);
    }
}
