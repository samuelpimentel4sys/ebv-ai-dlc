package br.com.ebv.prisma.domain.audit.port.in;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ExportAuditTrailUseCase {

    record Command(Map<String, Object> filters, String format, String purpose) {}

    record Result(
            UUID exportId,
            String status,
            String manifestHash,
            LocalDate retentionUntil,
            Instant requestedAt
    ) {}

    Result execute(Command command);
}
