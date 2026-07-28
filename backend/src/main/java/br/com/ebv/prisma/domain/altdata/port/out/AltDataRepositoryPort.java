package br.com.ebv.prisma.domain.altdata.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AltDataRepositoryPort {
    record BatchRecord(
            UUID batchId, String partnerCode, String utilityType, String sourceUri,
            Instant receivedAt, int recordCount, BigDecimal errorRate, BigDecimal qualityLimit,
            String status, String rejectionReason, UUID correlationId
    ) {}

    void save(BatchRecord record);
    List<BatchRecord> findRecent(int limit);
}
