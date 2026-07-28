package br.com.ebv.prisma.domain.mission.port.in;

import java.util.List;
import java.util.UUID;

public interface ListAchievementsUseCase {
    record Query(String documento) {}
    record Item(UUID achievementId, String code, String title) {}
    record Result(List<Item> achievements) {}
    Result execute(Query query);
}
