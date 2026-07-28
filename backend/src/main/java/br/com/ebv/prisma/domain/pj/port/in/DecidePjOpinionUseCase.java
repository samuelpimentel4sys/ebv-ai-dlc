package br.com.ebv.prisma.domain.pj.port.in;

import java.time.Instant;
import java.util.UUID;

public interface DecidePjOpinionUseCase {
    record Command(UUID opinionId, UUID actorId, String decision, String comment, String actorMaxLevel) {}
    record Result(UUID opinionId, String status, String levelCode, Instant decidedAt, UUID trailEntryId) {}
    Result execute(Command command);
}
