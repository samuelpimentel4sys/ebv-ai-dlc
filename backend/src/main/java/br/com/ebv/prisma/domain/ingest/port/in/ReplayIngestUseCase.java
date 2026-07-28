package br.com.ebv.prisma.domain.ingest.port.in;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface ReplayIngestUseCase {

    record ReplayCommand(
            String sourceId,
            OffsetDateTime windowStart,
            OffsetDateTime windowEnd,
            String justification
    ) {}

    record ReplayResult(UUID replayId, String status, int eventsQueued) {}

    ReplayResult execute(ReplayCommand command);
}
