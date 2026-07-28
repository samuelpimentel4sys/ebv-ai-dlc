package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.UUID;

public interface OpenDisputeUseCase {

    record Command(
            String documento,
            String reasonCode,
            String description,
            String channel,
            String recordRef
    ) {}

    record Result(UUID id, String protocol, String status, Instant dueAt) {}

    Result execute(Command command);
}
