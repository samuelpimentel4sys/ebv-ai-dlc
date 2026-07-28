package br.com.ebv.prisma.domain.dispute.port.out;

import java.time.Instant;
import java.util.Optional;

public interface SelfServiceSessionPort {

    record Session(String token, String documento, Instant expiresAt) {}

    Session create(String documento, Instant expiresAt);

    Optional<Session> findValid(String token);
}
