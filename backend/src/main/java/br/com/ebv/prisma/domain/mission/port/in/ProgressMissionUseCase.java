package br.com.ebv.prisma.domain.mission.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface ProgressMissionUseCase {
    record Command(UUID missionId, String documento, String verifiedEventType, UUID verifiedEventId, BigDecimal deltaPct) {}
    record Result(UUID enrollmentId, BigDecimal progressPct, String status, boolean achievementEarned) {}
    Result execute(Command command);
}
