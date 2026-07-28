package br.com.ebv.prisma.domain.dispute.port.out;

import java.time.Instant;

/**
 * Lab lockout (identify + tracking confirmation). In-memory stub; Redis-ready API.
 */
public interface DisputeLockoutPort {

    boolean isLocked(String key);

    Instant lockedUntil(String key);

    /** @return attempts after this failure; locks at 3 */
    int registerFailure(String key);

    void reset(String key);
}
