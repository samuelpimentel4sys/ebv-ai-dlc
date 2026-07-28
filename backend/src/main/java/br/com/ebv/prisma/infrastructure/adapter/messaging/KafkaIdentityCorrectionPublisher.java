package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.identity.port.out.IdentityCorrectionPublisherPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Component
@Profile("infra")
@Primary
public class KafkaIdentityCorrectionPublisher implements IdentityCorrectionPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(KafkaIdentityCorrectionPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String topic;

    public KafkaIdentityCorrectionPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${prisma.kafka.topic-identity-corrections:prisma.identity.corrections}") String topic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.topic = topic;
    }

    @Override
    public PublishAck publish(CorrectionEvent event) {
        try {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("eventId", event.eventId().toString());
            payload.put("action", event.action());
            payload.put("fromGr", event.fromGr().value().toString());
            payload.put("toGr", event.toGr().value().toString());
            payload.put("survivorDocumento", event.survivorDocumento());
            payload.put("survivorVersion", event.survivorVersion());
            payload.put("actorId", event.actorId().toString());
            payload.put("schemaVersion", "IdentityCorrection:1");

            String key = event.survivorDocumento();
            ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, payload.toString());
            record.headers().add(new RecordHeader("eventId", event.eventId().toString().getBytes(StandardCharsets.UTF_8)));
            record.headers().add(new RecordHeader("action", event.action().getBytes(StandardCharsets.UTF_8)));

            RecordMetadata meta = kafkaTemplate.send(record).get(15, TimeUnit.SECONDS).getRecordMetadata();
            log.info("KAFKA identity correction action={} topic={} partition={} offset={}",
                    event.action(), meta.topic(), meta.partition(), meta.offset());
            return new PublishAck(meta.topic(), meta.partition(), meta.offset());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao publicar correção identidade topic=" + topic, e);
        }
    }
}
