package br.com.ebv.prisma.domain.coach.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface GetCoachProgressUseCase {
    record Query(String documento) {}
    record Result(UUID journeyId, BigDecimal percentComplete, int goalsDone, int goalsTotal) {}
    Result execute(Query query);
}
