package br.com.ebv.prisma.domain.pj.port.in;

import java.util.UUID;

public interface SubmitPjOpinionUseCase {
    record Command(UUID opinionId, UUID actorId, String comment) {}
    record Result(UUID opinionId, String status, String requiredLevel, UUID trailId) {}
    Result execute(Command command);
}
