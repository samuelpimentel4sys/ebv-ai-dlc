package br.com.ebv.prisma.application.events;

import br.com.ebv.prisma.domain.events.exception.UnprocessableEventException;
import br.com.ebv.prisma.domain.events.port.in.PublishCreditEventUseCase;
import br.com.ebv.prisma.domain.events.port.out.CreditEventPublisherPort;
import br.com.ebv.prisma.domain.events.port.out.CreditEventReceiptPort;
import br.com.ebv.prisma.domain.events.port.out.SchemaCompatibilityPort;
import br.com.ebv.prisma.domain.events.service.DocumentPartitioning;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PublishCreditEventService implements PublishCreditEventUseCase {

    private final CreditEventPublisherPort publisher;
    private final CreditEventReceiptPort receiptPort;
    private final SchemaCompatibilityPort schemaCompatibility;
    private final ObjectMapper objectMapper;
    private final String topic;
    private final int partitionCount;
    private final String schemaVersion;

    public PublishCreditEventService(
            CreditEventPublisherPort publisher,
            CreditEventReceiptPort receiptPort,
            SchemaCompatibilityPort schemaCompatibility,
            ObjectMapper objectMapper,
            @Value("${prisma.kafka.topic-credit-events:prisma.credit.events}") String topic,
            @Value("${prisma.kafka.partition-count:6}") int partitionCount,
            @Value("${prisma.events.schema-version:CreditEvent:1}") String schemaVersion
    ) {
        this.publisher = publisher;
        this.receiptPort = receiptPort;
        this.schemaCompatibility = schemaCompatibility;
        this.objectMapper = objectMapper;
        this.topic = topic;
        this.partitionCount = partitionCount;
        this.schemaVersion = schemaVersion;
    }

    @Override
    @Transactional
    public PublishResult execute(PublishCommand command) {
        if (command.idempotencyKey() != null) {
            var existing = receiptPort.findByIdempotencyKey(command.idempotencyKey());
            if (existing.isPresent()) {
                var r = existing.get();
                return new PublishResult(
                        r.eventId(), r.topic(), r.partition(), r.offset(), r.schemaVersion(), "DUPLICATE"
                );
            }
        }

        schemaCompatibility.assertCompatible(command.eventType().name(), schemaVersion);

        UUID eventId = command.idempotencyKey() != null ? command.idempotencyKey() : UUID.randomUUID();

        String documento;
        try {
            documento = DocumentPartitioning.partitionKey(command.documento());
            DocumentPartitioning.partitionFor(documento, partitionCount);
        } catch (IllegalArgumentException | NullPointerException ex) {
            receiptPort.saveDlq(
                    "{\"documento\":\"" + String.valueOf(command.documento()) + "\"}",
                    "MISSING_OR_INVALID_DOCUMENT"
            );
            throw new UnprocessableEventException("Sem documento válido — evento desviado para DLQ");
        }

        int partition = DocumentPartitioning.partitionFor(documento, partitionCount);

        String json;
        try {
            json = objectMapper.writeValueAsString(
                    command.payload() != null ? command.payload() : java.util.Map.of()
            );
        } catch (JsonProcessingException e) {
            receiptPort.saveDlq("{}", "PAYLOAD_SERIALIZATION: " + e.getMessage());
            throw new UnprocessableEventException("payload inválido");
        }

        CreditEventPublisherPort.PublishAck ack;
        try {
            ack = publisher.publish(new CreditEventPublisherPort.PublishRequest(
                    eventId, documento, command.eventType().name(), json, schemaVersion
            ));
        } catch (RuntimeException ex) {
            receiptPort.saveDlq(json, "PUBLISH_FAILED: " + ex.getMessage());
            throw ex;
        }

        CreditEventReceiptPort.Receipt receipt = new CreditEventReceiptPort.Receipt(
                eventId,
                documento,
                command.eventType().name(),
                ack.topic() != null ? ack.topic() : topic,
                ack.partition() >= 0 ? ack.partition() : partition,
                ack.offset(),
                schemaVersion
        );
        receiptPort.save(receipt, command.idempotencyKey());

        return new PublishResult(
                eventId,
                receipt.topic(),
                receipt.partition(),
                receipt.offset(),
                schemaVersion,
                "ACCEPTED"
        );
    }
}
