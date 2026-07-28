package br.com.ebv.prisma.domain.dispute.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisputeAttachmentRepositoryPort {

    record AttachmentRecord(
            UUID id,
            UUID disputeId,
            String filename,
            String contentType,
            String sha256,
            String storageUri,
            UUID prevAttachmentId,
            Instant createdAt
    ) {}

    void save(AttachmentRecord record);

    List<AttachmentRecord> findByDisputeId(UUID disputeId);

    Optional<AttachmentRecord> findById(UUID id);

    boolean existsStorageUri(String storageUri);
}
