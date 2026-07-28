package br.com.ebv.prisma.infrastructure.config;

import br.com.ebv.prisma.domain.pj.exception.PjValidationException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LabActorResolverTest {

    @Test
    void fallbackUsesLabActorWhenEnabled() {
        var r = new LabActorResolver(true);
        assertEquals(LabActorResolver.LAB_ACTOR, r.resolve(null, null));
    }

    @Test
    void bodyWinsOverFallback() {
        var r = new LabActorResolver(true);
        UUID body = UUID.randomUUID();
        assertEquals(body, r.resolve(body, null));
    }

    @Test
    void noFallbackRequiresActor() {
        var r = new LabActorResolver(false);
        assertThrows(PjValidationException.class, () -> r.resolve(null, null));
    }
}
