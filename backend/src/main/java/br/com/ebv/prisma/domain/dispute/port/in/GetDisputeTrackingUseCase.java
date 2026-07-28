package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.List;

public interface GetDisputeTrackingUseCase {

    record Query(String protocol, String confirmDocumento) {}

    record TimelinePreview(String eventType, Instant occurredAt) {}

    record Result(
            String protocol,
            String stage,
            String status,
            Instant slaDueAt,
            long daysRemaining,
            String nextAction,
            String nextActor,
            List<TimelinePreview> timelinePreview
    ) {}

    Result execute(Query query);
}
