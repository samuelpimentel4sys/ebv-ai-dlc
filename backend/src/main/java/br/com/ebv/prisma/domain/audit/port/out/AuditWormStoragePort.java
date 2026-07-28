package br.com.ebv.prisma.domain.audit.port.out;

import java.util.UUID;

public interface AuditWormStoragePort {

    /** Persist immutable JSON; refuse overwrite. Returns storage URI. */
    String put(UUID eventId, String canonicalJson);
}
