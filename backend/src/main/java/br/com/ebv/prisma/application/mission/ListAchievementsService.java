package br.com.ebv.prisma.application.mission;

import br.com.ebv.prisma.domain.mission.exception.MissionValidationException;
import br.com.ebv.prisma.domain.mission.port.in.ListAchievementsUseCase;
import br.com.ebv.prisma.domain.mission.port.out.MissionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListAchievementsService implements ListAchievementsUseCase {

    private final MissionRepositoryPort repo;

    public ListAchievementsService(MissionRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new MissionValidationException("documento obrigatório");
        }
        var items = repo.findAchievements(ListMissionsService.sha256(query.documento().trim())).stream()
                .map(a -> new Item(a.achievementId(), a.code(), a.title()))
                .toList();
        return new Result(items);
    }
}
