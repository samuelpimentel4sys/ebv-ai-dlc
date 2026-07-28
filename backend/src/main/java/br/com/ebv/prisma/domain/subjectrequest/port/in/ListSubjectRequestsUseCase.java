package br.com.ebv.prisma.domain.subjectrequest.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListSubjectRequestsUseCase {

    record Query(String rightType, String status, Instant dueBefore, int page, int size) {}

    record Item(
            UUID requestId,
            String rightType,
            String subjectToken,
            String channel,
            String description,
            String status,
            Instant dueAt,
            String responseSummary,
            Instant createdAt,
            Instant updatedAt
    ) {}

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
