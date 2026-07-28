package br.com.ebv.prisma.domain.events.port.in;

import br.com.ebv.prisma.domain.events.model.CreditEventType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public interface PublishCreditEventUseCase {

    record PublishCommand(
            CreditEventType eventType,
            String documento,
            Instant occurredAt,
            Map<String, Object> payload,
            UUID idempotencyKey
    ) {}

    record PublishResult(
            UUID eventId,
            String topic,
            int partition,
            long offset,
            String schemaVersion,
            String status
    ) {}

    PublishResult execute(PublishCommand command);
}
