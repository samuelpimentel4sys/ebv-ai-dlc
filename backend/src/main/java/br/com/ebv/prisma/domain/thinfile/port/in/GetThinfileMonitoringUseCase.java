package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface GetThinfileMonitoringUseCase {
    record Item(UUID runId, String modelVersion, String status, BigDecimal aucCurrent, BigDecimal degradationPct) {}
    record Result(List<Item> runs) {}
    Result execute();
}
