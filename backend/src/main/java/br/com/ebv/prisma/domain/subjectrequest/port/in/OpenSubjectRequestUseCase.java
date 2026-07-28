package br.com.ebv.prisma.domain.subjectrequest.port.in;

import java.time.Instant;
import java.util.UUID;

public interface OpenSubjectRequestUseCase {

    record Command(String rightType, String subjectToken, String channel, String description) {}

    record Result(
            UUID requestId,
            String rightType,
            String status,
            Instant dueAt,
            Instant createdAt
    ) {}

    Result execute(Command command);
}
