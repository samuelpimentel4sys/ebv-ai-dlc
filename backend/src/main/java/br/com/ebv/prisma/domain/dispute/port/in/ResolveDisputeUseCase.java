package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.UUID;

public interface ResolveDisputeUseCase {

    record Command(UUID id, String outcome, String rationale) {}

    record Result(
            UUID id,
            String protocol,
            String status,
            String outcome,
            Instant resolvedAt
    ) {}

    Result execute(Command command);
}
