package br.com.ebv.prisma.domain.events.port.out;

import java.util.Optional;
import java.util.UUID;

public interface CreditEventReceiptPort {

    record Receipt(
            UUID eventId,
            String documento,
            String eventType,
            String topic,
            int partition,
            long offset,
            String schemaVersion
    ) {}

    Optional<Receipt> findById(UUID eventId);

    Optional<Receipt> findByIdempotencyKey(UUID idempotencyKey);

    void save(Receipt receipt, UUID idempotencyKey);

    void saveDlq(String rawPayload, String reason);
}
