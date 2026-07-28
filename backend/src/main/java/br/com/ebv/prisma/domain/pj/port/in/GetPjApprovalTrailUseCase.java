package br.com.ebv.prisma.domain.pj.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface GetPjApprovalTrailUseCase {
    record Query(UUID opinionId) {}
    record TrailItem(UUID id, String action, UUID actorId, String levelCode, String comment, Instant at) {}
    record Result(UUID opinionId, List<TrailItem> trail) {}
    Result execute(Query query);
}
