package br.com.ebv.prisma.domain.events.port.out;

import java.util.UUID;

public interface CreditEventPublisherPort {

    record PublishRequest(
            UUID eventId,
            String documento,
            String eventType,
            String jsonPayload,
            String schemaVersion
    ) {}

    record PublishAck(String topic, int partition, long offset) {}

    PublishAck publish(PublishRequest request);
}
