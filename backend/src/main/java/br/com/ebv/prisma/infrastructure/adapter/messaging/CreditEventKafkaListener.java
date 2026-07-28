package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.events.port.out.CreditEventReceiptPort;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumidor mínimo F01 — observa ordem por partição e desvia payload inválido para DLQ persistida.
 * Recálculo de score (F03) plugará aqui depois.
 */
@Component
@Profile("infra")
public class CreditEventKafkaListener {

    private static final Logger log = LoggerFactory.getLogger(CreditEventKafkaListener.class);

    private final CreditEventReceiptPort receiptPort;

    public CreditEventKafkaListener(CreditEventReceiptPort receiptPort) {
        this.receiptPort = receiptPort;
    }

    @KafkaListener(
            topics = "${prisma.kafka.topic-credit-events:prisma.credit.events}",
            groupId = "${spring.kafka.consumer.group-id:prisma-backend}"
    )
    public void onCreditEvent(ConsumerRecord<String, String> record) {
        try {
            if (record.value() == null || record.value().isBlank()) {
                receiptPort.saveDlq("{}", "EMPTY_PAYLOAD");
                return;
            }
            if (record.key() == null || record.key().isBlank()) {
                receiptPort.saveDlq(record.value(), "MISSING_DOCUMENT_KEY");
                return;
            }
            log.info("KAFKA consume topic={} partition={} offset={} key={} bytes={}",
                    record.topic(), record.partition(), record.offset(),
                    record.key(), record.value().length());
        } catch (Exception e) {
            log.error("Falha consumo offset={} — DLQ", record.offset(), e);
            receiptPort.saveDlq(
                    record.value() != null ? record.value() : "{}",
                    "CONSUME_ERROR:" + e.getClass().getSimpleName()
            );
        }
    }
}
