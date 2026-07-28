package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListDisputeAttachmentsUseCase {

    record Query(UUID disputeId) {}

    record Item(
            UUID id,
            String filename,
            String contentType,
            String sha256,
            UUID prevAttachmentId,
            Instant createdAt
    ) {}

    List<Item> execute(Query query);
}
