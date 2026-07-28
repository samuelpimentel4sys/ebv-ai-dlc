package br.com.ebv.prisma.infrastructure.adapter.messaging;

import br.com.ebv.prisma.domain.identity.port.out.IdentityCorrectionPublisherPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Stub local quando profile infra (Kafka) não está ativo. */
@Component
@Profile("!infra")
public class LocalIdentityCorrectionPublisher implements IdentityCorrectionPublisherPort {

    private static final Logger log = LoggerFactory.getLogger(LocalIdentityCorrectionPublisher.class);

    private final String topic;
    private long offsetSequence = 0L;

    public LocalIdentityCorrectionPublisher(
            @Value("${prisma.kafka.topic-identity-corrections:prisma.identity.corrections}") String topic
    ) {
        this.topic = topic;
    }

    @Override
    public synchronized PublishAck publish(CorrectionEvent event) {
        long offset = ++offsetSequence;
        log.info("LOCAL identity correction action={} from={} to={} topic={} offset={}",
                event.action(), event.fromGr().value(), event.toGr().value(), topic, offset);
        return new PublishAck(topic, 0, offset);
    }
}
