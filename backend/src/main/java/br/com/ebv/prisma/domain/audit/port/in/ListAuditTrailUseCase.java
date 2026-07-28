package br.com.ebv.prisma.domain.audit.port.in;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListAuditTrailUseCase {

    record Query(
            String documento,
            String actorId,
            String eventType,
            Instant from,
            Instant to,
            int page,
            int size
    ) {}

    record Item(
            UUID id,
            String documento,
            String actorId,
            String eventType,
            String sha256,
            String prevSha256,
            Instant createdAt
    ) {}

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
