package br.com.ebv.prisma.domain.altdata.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface IngestAltDataUseCase {
    record Command(
            String documento,
            String partnerCode,
            String utilityType,
            String sourceUri,
            int recordCount,
            BigDecimal errorRate
    ) {}
    record Result(UUID batchId, String status, BigDecimal errorRate, UUID correlationId) {}
    Result execute(Command command);
}
