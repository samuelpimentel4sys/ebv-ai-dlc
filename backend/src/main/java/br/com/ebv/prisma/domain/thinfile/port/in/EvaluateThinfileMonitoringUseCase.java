package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface EvaluateThinfileMonitoringUseCase {
    record Command(String modelVersion, BigDecimal aucCurrent) {}
    record Result(UUID runId, String status, BigDecimal degradationPct, String actionTaken) {}
    Result execute(Command command);
}
