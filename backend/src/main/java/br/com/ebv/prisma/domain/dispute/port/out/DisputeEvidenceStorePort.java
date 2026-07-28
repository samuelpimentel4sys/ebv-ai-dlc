package br.com.ebv.prisma.domain.dispute.port.out;

import java.util.UUID;

public interface DisputeEvidenceStorePort {

    /** Writes bytes WORM-style; refuses overwrite. Returns storage URI. */
    String store(UUID disputeId, UUID attachmentId, byte[] content);

    byte[] read(String storageUri);
}
