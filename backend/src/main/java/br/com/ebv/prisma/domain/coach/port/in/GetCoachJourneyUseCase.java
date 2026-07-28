package br.com.ebv.prisma.domain.coach.port.in;

import java.util.List;
import java.util.UUID;

public interface GetCoachJourneyUseCase {
    record Query(String documento) {}
    record Goal(UUID goalId, String goalType, String title, String estimateText, String status) {}
    record Result(UUID journeyId, String status, List<Goal> goals) {}
    Result execute(Query query);
}
