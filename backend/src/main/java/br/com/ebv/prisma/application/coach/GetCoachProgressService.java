package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachNotFoundException;
import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachProgressUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class GetCoachProgressService implements GetCoachProgressUseCase {

    private final CoachRepositoryPort repo;

    public GetCoachProgressService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new CoachValidationException("documento obrigatório");
        }
        String hash = GetCoachJourneyService.sha256(query.documento().trim());
        var journey = repo.findActiveJourney(hash)
                .orElseThrow(() -> new CoachNotFoundException("jornada não encontrada"));
        var goals = repo.findGoals(journey.journeyId());
        int total = goals.size();
        int done = (int) goals.stream().filter(g -> "DONE".equals(g.status())).count();
        BigDecimal pct = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(done * 100.0 / total).setScale(2, RoundingMode.HALF_UP);
        return new Result(journey.journeyId(), pct, done, total);
    }
}
