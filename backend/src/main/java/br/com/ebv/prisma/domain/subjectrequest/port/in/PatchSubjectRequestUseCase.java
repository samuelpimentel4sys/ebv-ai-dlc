package br.com.ebv.prisma.domain.subjectrequest.port.in;

import java.time.Instant;
import java.util.UUID;

public interface PatchSubjectRequestUseCase {

    record Command(UUID id, String action, String responseSummary, UUID attachmentId) {}

    record Result(
            UUID requestId,
            String rightType,
            String status,
            Instant dueAt,
            String responseSummary,
            UUID attachmentId,
            Instant updatedAt
    ) {}

    Result execute(Command command);
}
