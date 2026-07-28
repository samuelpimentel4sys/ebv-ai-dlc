package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.List;

public interface GetDisputeTimelineUseCase {

    record Query(String protocol, String confirmDocumento) {}

    record Event(String eventType, String message, String actor, Instant at) {}

    List<Event> execute(Query query);
}
