package br.com.ebv.prisma.domain.dispute.port.in;

import java.time.Instant;
import java.util.UUID;

public interface UploadDisputeAttachmentUseCase {

    record Command(
            UUID disputeId,
            String filename,
            String contentType,
            byte[] content,
            UUID prevAttachmentId
    ) {}

    record Result(
            UUID id,
            String filename,
            String contentType,
            String sha256,
            String status,
            Instant uploadedAt
    ) {}

    Result execute(Command command);
}
