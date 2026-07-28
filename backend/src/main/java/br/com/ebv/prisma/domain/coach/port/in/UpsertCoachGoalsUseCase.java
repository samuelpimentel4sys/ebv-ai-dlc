package br.com.ebv.prisma.domain.coach.port.in;

import java.util.List;
import java.util.UUID;

public interface UpsertCoachGoalsUseCase {
    record GoalInput(String goalType, String title, String estimateText, Boolean guaranteesApproval) {}
    record Command(String documento, List<GoalInput> goals) {}
    record Item(UUID goalId, String title, String status) {}
    record Result(UUID journeyId, List<Item> goals) {}
    Result execute(Command command);
}
