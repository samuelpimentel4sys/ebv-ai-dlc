package br.com.ebv.prisma.infrastructure.adapter.liveness;

import br.com.ebv.prisma.domain.liveness.port.out.RekognitionLivenessPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "prisma.liveness.mode", havingValue = "stub", matchIfMissing = true)
public class StubRekognitionLivenessAdapter implements RekognitionLivenessPort {

    @Override
    public CreatedSession createSession(UUID customerId, String idempotencyKey) {
        return new CreatedSession(UUID.randomUUID().toString());
    }
}
