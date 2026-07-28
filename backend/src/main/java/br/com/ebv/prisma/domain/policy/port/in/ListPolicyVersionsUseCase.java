package br.com.ebv.prisma.domain.policy.port.in;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ListPolicyVersionsUseCase {

    record Query(String status, String author, Instant from, Instant to, int page, int size) {}

    record Item(
            UUID id,
            String version,
            String status,
            String artifactHash,
            String author,
            String approvalId,
            Instant effectiveAt,
            Instant createdAt,
            Instant publishedAt,
            boolean immutable
    ) {}

    record Page(List<Item> items, int page, int size, long totalElements, int totalPages) {}

    Page execute(Query query);
}
