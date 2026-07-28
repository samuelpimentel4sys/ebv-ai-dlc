package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.SimulateCoachActionUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SimulateCoachActionService implements SimulateCoachActionUseCase {

    private final CoachRepositoryPort repo;

    public SimulateCoachActionService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.actionCode() == null) {
            throw new CoachValidationException("documento e actionCode obrigatórios");
        }
        UUID simId = UUID.randomUUID();
        UUID snapshot = command.snapshotScoreId() != null ? command.snapshotScoreId() : UUID.randomUUID();
        boolean estimable = !"UNKNOWN".equalsIgnoreCase(command.actionCode());
        Integer min = estimable ? 10 : null;
        Integer max = estimable ? 35 : null;
        Integer dMin = estimable ? 30 : null;
        Integer dMax = estimable ? 90 : null;
        String msg = estimable
                ? "Estimativa lab: efeito positivo possível, sem garantia de aprovação"
                : "Ação não estimável no modelo atual";
        repo.saveSimulation(new CoachRepositoryPort.SimulationRecord(
                simId, GetCoachJourneyService.sha256(command.documento().trim()), snapshot,
                command.actionCode(), estimable, min, max, dMin, dMax, msg, Instant.now()
        ));
        return new Result(simId, estimable, min, max, dMin, dMax, msg);
    }
}
