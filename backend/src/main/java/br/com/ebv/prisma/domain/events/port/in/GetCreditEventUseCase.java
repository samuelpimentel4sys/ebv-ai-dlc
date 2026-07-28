package br.com.ebv.prisma.domain.events.port.in;

import java.util.Optional;
import java.util.UUID;

public interface GetCreditEventUseCase {

    record EventView(
            UUID eventId,
            String documento,
            String eventType,
            String topic,
            int partition,
            long offset,
            String schemaVersion,
            String status
    ) {}

    Optional<EventView> execute(UUID eventId);
}
