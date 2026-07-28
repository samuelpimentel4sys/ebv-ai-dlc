package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.events.port.out.CreditEventReceiptPort;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Consumidor F01 + F03 — observa ordem por partição, desvia payload inválido para DLQ persistida.
 * Para eventos materiais (NEGATIVACAO, PROTESTO) aciona recálculo de score (F03).
 */
@Component
@Profile("infra")
public class CreditEventKafkaListener {

    private static final Logger log = LoggerFactory.getLogger(CreditEventKafkaListener.class);
    private static final Set<String> MATERIAL_TYPES = Set.of("NEGATIVACAO", "PROTESTO");

    private final CreditEventReceiptPort receiptPort;
    private final RecalculateScoreUseCase recalculateScore;
    private final ObjectMapper objectMapper;

    public CreditEventKafkaListener(
            CreditEventReceiptPort receiptPort,
            RecalculateScoreUseCase recalculateScore,
            ObjectMapper objectMapper
    ) {
        this.receiptPort = receiptPort;
        this.recalculateScore = recalculateScore;
        this.objectMapper = objectMapper;
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

            String eventType = parseEventType(record.value());
            if (eventType != null && MATERIAL_TYPES.contains(eventType)) {
                log.info("Material event type={} documento={} — triggering score recalc", eventType, record.key());
                recalculateScore.execute(new RecalculateScoreUseCase.Command(
                        record.key(), "KAFKA:" + eventType, false
                ));
            }

        } catch (Exception e) {
            log.error("Falha consumo offset={} — DLQ", record.offset(), e);
            receiptPort.saveDlq(
                    record.value() != null ? record.value() : "{}",
                    "CONSUME_ERROR:" + e.getClass().getSimpleName()
            );
        }
    }

    private String parseEventType(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode typeNode = root.get("eventType");
            if (typeNode == null) typeNode = root.get("type");
            return typeNode != null ? typeNode.asText().toUpperCase() : null;
        } catch (Exception e) {
            log.debug("Não foi possível parsear eventType do payload", e);
            return null;
        }
    }
}
