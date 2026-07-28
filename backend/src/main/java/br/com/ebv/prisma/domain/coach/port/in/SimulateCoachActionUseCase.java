package br.com.ebv.prisma.domain.coach.port.in;

import java.util.UUID;

public interface SimulateCoachActionUseCase {
    record Command(String documento, String actionCode, UUID snapshotScoreId) {}
    record Result(UUID simulationId, boolean estimable, Integer scoreDeltaMin, Integer scoreDeltaMax,
                  Integer effectDaysMin, Integer effectDaysMax, String message) {}
    Result execute(Command command);
}
