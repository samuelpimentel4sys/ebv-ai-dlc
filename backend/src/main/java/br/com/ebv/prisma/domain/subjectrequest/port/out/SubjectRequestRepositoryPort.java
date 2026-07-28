package br.com.ebv.prisma.domain.subjectrequest.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubjectRequestRepositoryPort {

    record SubjectRequestRecord(
            UUID id,
            String rightType,
            String subjectToken,
            String channel,
            String description,
            String status,
            Instant dueAt,
            String responseSummary,
            UUID attachmentId,
            Instant createdAt,
            Instant updatedAt
    ) {}

    record PageResult(List<SubjectRequestRecord> items, int page, int size, long totalElements, int totalPages) {}

    void save(SubjectRequestRecord record);

    Optional<SubjectRequestRecord> findById(UUID id);

    PageResult search(String rightType, String status, Instant dueBefore, int page, int size);
}
