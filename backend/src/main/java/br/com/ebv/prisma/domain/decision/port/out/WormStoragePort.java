package br.com.ebv.prisma.domain.decision.port.out;

import java.util.Optional;
import java.util.UUID;

public interface WormStoragePort {

    /**
     * Immutable put — refuse overwrite (Object Lock simulation).
     * @return storage URI
     */
    String put(UUID decisionId, String canonicalJson);

    Optional<String> get(UUID decisionId);
}
