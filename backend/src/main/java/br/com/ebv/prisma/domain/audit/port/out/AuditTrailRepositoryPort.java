package br.com.ebv.prisma.domain.audit.port.out;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditTrailRepositoryPort {

    record AuditEventRecord(
            UUID id,
            String documento,
            String actorId,
            String eventType,
            String payloadJson,
            String sha256,
            String prevSha256,
            Instant createdAt
    ) {}

    record AuditExportRecord(
            UUID id,
            String status,
            String format,
            String purpose,
            String manifestHash,
            LocalDate retentionUntil,
            Instant requestedAt,
            String filtersJson
    ) {}

    record PageResult(List<AuditEventRecord> items, int page, int size, long totalElements, int totalPages) {}

    void saveEvent(AuditEventRecord record);

    Optional<String> findLatestSha256();

    PageResult search(
            String documento,
            String actorId,
            String eventType,
            Instant from,
            Instant to,
            int page,
            int size
    );

    void saveExport(AuditExportRecord record);
}
