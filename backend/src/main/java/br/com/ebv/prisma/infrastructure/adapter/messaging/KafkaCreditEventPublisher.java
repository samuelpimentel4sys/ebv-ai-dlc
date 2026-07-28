package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.events.port.out.CreditEventPublisherPort;
import br.com.ebv.prisma.domain.events.service.DocumentPartitioning;
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

@Component("kafkaCreditEventPublisher")
@Profile("infra")
@Primary
public class KafkaCreditEventPublisher implements CreditEventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(KafkaCreditEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final String topic;
    private final int partitionCount;

    public KafkaCreditEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            @Value("${prisma.kafka.topic-credit-events:prisma.credit.events}") String topic,
            @Value("${prisma.kafka.partition-count:6}") int partitionCount
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
        this.partitionCount = partitionCount;
    }

    @Override
    public PublishAck publish(PublishRequest request) {
        String key = DocumentPartitioning.partitionKey(request.documento());
        int partition = DocumentPartitioning.partitionFor(key, partitionCount);

        ProducerRecord<String, String> record = new ProducerRecord<>(topic, partition, key, request.jsonPayload());
        record.headers().add(new RecordHeader("eventId", request.eventId().toString().getBytes(StandardCharsets.UTF_8)));
        record.headers().add(new RecordHeader("eventType", request.eventType().getBytes(StandardCharsets.UTF_8)));
        record.headers().add(new RecordHeader("schemaVersion", request.schemaVersion().getBytes(StandardCharsets.UTF_8)));

        try {
            RecordMetadata meta = kafkaTemplate.send(record).get(15, TimeUnit.SECONDS).getRecordMetadata();
            log.info("KAFKA published eventId={} topic={} partition={} offset={}",
                    request.eventId(), meta.topic(), meta.partition(), meta.offset());
            return new PublishAck(meta.topic(), meta.partition(), meta.offset());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao publicar no Kafka topic=" + topic, e);
        }
    }
}
