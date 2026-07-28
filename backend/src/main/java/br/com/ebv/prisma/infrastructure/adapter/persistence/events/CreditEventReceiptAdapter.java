package br.com.ebv.prisma.infrastructure.adapter.persistence.events;

import br.com.ebv.prisma.domain.events.port.out.CreditEventReceiptPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class CreditEventReceiptAdapter implements CreditEventReceiptPort {

    private final EventReceiptJpaRepository receiptJpa;
    private final EventDlqJpaRepository dlqJpa;

    public CreditEventReceiptAdapter(EventReceiptJpaRepository receiptJpa, EventDlqJpaRepository dlqJpa) {
        this.receiptJpa = receiptJpa;
        this.dlqJpa = dlqJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Receipt> findById(UUID eventId) {
        return receiptJpa.findById(eventId).map(this::toReceipt);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Receipt> findByIdempotencyKey(UUID idempotencyKey) {
        return receiptJpa.findByIdempotencyKey(idempotencyKey).map(this::toReceipt);
    }

    @Override
    public void save(Receipt receipt, UUID idempotencyKey) {
        EventReceiptEntity e = new EventReceiptEntity();
        e.setEventId(receipt.eventId());
        e.setDocumento(receipt.documento());
        e.setEventType(receipt.eventType());
        e.setTopic(receipt.topic());
        e.setPartitionId(receipt.partition());
        e.setOffsetId(receipt.offset());
        e.setSchemaVersion(receipt.schemaVersion());
        e.setIdempotencyKey(idempotencyKey);
        e.setReceivedAt(OffsetDateTime.now());
        receiptJpa.save(e);
    }

    @Override
    public void saveDlq(String rawPayload, String reason) {
        EventDlqEntity d = new EventDlqEntity();
        d.setId(UUID.randomUUID());
        d.setRawPayload(rawPayload == null || rawPayload.isBlank() ? "{}" : rawPayload);
        d.setReason(reason.length() > 200 ? reason.substring(0, 200) : reason);
        d.setReceivedAt(OffsetDateTime.now());
        dlqJpa.save(d);
    }

    private Receipt toReceipt(EventReceiptEntity e) {
        return new Receipt(
                e.getEventId(),
                e.getDocumento() != null ? e.getDocumento().trim() : null,
                e.getEventType(),
                e.getTopic(),
                e.getPartitionId(),
                e.getOffsetId(),
                e.getSchemaVersion()
        );
    }
}
