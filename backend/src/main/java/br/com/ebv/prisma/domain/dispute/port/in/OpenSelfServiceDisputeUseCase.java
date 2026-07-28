package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.UUID;

public interface OpenSelfServiceDisputeUseCase {

    record Command(String sessionToken, String reasonCode, String description, String recordRef) {}

    record Result(UUID id, String protocol, String status, Instant dueAt, String trackingUrl) {}

    Result execute(Command command);
}
