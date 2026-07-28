package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.events.port.out.CreditEventPublisherPort;
import br.com.ebv.prisma.domain.events.service.DocumentPartitioning;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Publisher local quando profile infra (Kafka) não está ativo. */
@Component
@Profile("!infra")
public class LocalCreditEventPublisher implements CreditEventPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(LocalCreditEventPublisher.class);

    private final String topic;
    private final int partitionCount;
    private long offsetSequence = 0L;

    public LocalCreditEventPublisher(
            @Value("${prisma.kafka.topic-credit-events:prisma.credit.events}") String topic,
            @Value("${prisma.kafka.partition-count:6}") int partitionCount
    ) {
        this.topic = topic;
        this.partitionCount = partitionCount;
    }

    @Override
    public synchronized PublishAck publish(PublishRequest request) {
        int partition = DocumentPartitioning.partitionFor(request.documento(), partitionCount);
        long offset = ++offsetSequence;
        log.info("LOCAL publish eventId={} doc={} type={} topic={} partition={} offset={}",
                request.eventId(), request.documento(), request.eventType(), topic, partition, offset);
        return new PublishAck(topic, partition, offset);
    }
}
