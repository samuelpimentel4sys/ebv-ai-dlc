package br.com.ebv.prisma.infrastructure.config;

import br.com.ebv.prisma.domain.pj.exception.PjValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * OBS-06 — LAB_ACTOR só com {@code prisma.lab.actor-fallback=true}.
 * Com JWT: actor = claim {@code sub}.
 */
@Component
public class LabActorResolver {

    public static final UUID LAB_ACTOR = UUID.fromString("00000000-0000-4000-8000-0000000000aa");

    private final boolean actorFallback;

    public LabActorResolver(@Value("${prisma.lab.actor-fallback:false}") boolean actorFallback) {
        this.actorFallback = actorFallback;
    }

    public UUID resolve(UUID fromBody, Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null && !sub.isBlank()) {
                try {
                    return UUID.fromString(sub);
                } catch (IllegalArgumentException ex) {
                    return UUID.nameUUIDFromBytes(sub.getBytes(StandardCharsets.UTF_8));
                }
            }
        }
        if (fromBody != null) {
            return fromBody;
        }
        if (actorFallback) {
            return LAB_ACTOR;
        }
        throw new PjValidationException(
                "actorId obrigatório (lab: defina prisma.lab.actor-fallback=true ou envie actorId no body)"
        );
    }

    public boolean isActorFallbackEnabled() {
        return actorFallback;
    }
}
