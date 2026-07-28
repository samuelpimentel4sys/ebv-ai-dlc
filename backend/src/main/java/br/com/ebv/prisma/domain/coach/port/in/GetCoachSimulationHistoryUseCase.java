package br.com.ebv.prisma.domain.coach.port.in;

import java.util.List;
import java.util.UUID;

public interface GetCoachSimulationHistoryUseCase {
    record Query(String documento) {}
    record Item(UUID simulationId, String actionCode, boolean estimable, String message) {}
    record Result(List<Item> simulations) {}
    Result execute(Query query);
}
