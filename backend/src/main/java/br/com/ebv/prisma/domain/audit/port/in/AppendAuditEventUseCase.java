package br.com.ebv.prisma.domain.audit.port.in;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public interface AppendAuditEventUseCase {

    record Command(
            String documento,
            String actorId,
            String eventType,
            Map<String, Object> payload
    ) {}

    record Result(UUID eventId, String sha256, String prevSha256) {}

    Result execute(Command command);
}
