package br.com.ebv.prisma.application.dispute;

import br.com.ebv.prisma.domain.dispute.port.out.SelfServiceSessionPort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemorySelfServiceSessionAdapter implements SelfServiceSessionPort {

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();

    @Override
    public Session create(String documento, Instant expiresAt) {
        String token = "ss-" + UUID.randomUUID();
        Session session = new Session(token, documento, expiresAt);
        sessions.put(token, session);
        return session;
    }

    @Override
    public Optional<Session> findValid(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        Session s = sessions.get(token.trim());
        if (s == null) {
            return Optional.empty();
        }
        if (Instant.now().isAfter(s.expiresAt())) {
            sessions.remove(token.trim());
            return Optional.empty();
        }
        return Optional.of(s);
    }
}
