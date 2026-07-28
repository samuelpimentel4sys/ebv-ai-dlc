package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachSimulationHistoryUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetCoachSimulationHistoryService implements GetCoachSimulationHistoryUseCase {

    private final CoachRepositoryPort repo;

    public GetCoachSimulationHistoryService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new CoachValidationException("documento obrigatório");
        }
        var items = repo.findSimulations(GetCoachJourneyService.sha256(query.documento().trim())).stream()
                .map(s -> new Item(s.simulationId(), s.actionCode(), s.estimable(), s.message()))
                .toList();
        return new Result(items);
    }
}
