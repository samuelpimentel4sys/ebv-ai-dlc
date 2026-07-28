package br.com.ebv.prisma.domain.policy.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PolicyVersionRepositoryPort {

    record PolicyVersionRecord(
            UUID id,
            String version,
            String status,
            String artifactJson,
            String artifactHash,
            String author,
            String approvalId,
            Instant effectiveAt,
            String releaseNote,
            String gitCommit,
            Instant createdAt,
            Instant publishedAt,
            boolean immutable
    ) {}

    record PageResult(List<PolicyVersionRecord> items, int page, int size, long totalElements, int totalPages) {}

    Optional<PolicyVersionRecord> findById(UUID id);

    PageResult search(String status, String author, Instant from, Instant to, int page, int size);

    void save(PolicyVersionRecord record);
}
