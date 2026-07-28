package br.com.ebv.prisma.domain.altdata.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface GetAltQualityUseCase {
    record Item(UUID batchId, String partnerCode, String status, BigDecimal errorRate) {}
    record Result(List<Item> batches) {}
    Result execute();
}
