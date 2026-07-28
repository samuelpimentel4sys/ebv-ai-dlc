package br.com.ebv.prisma.domain.scoring.port.in;

import java.time.Instant;
import java.util.List;

public interface PromoteModelUseCase {

    record Command(
            String modelId,
            String version,
            String toStage,
            boolean canaryMetricsOk,
            List<String> approverIds,
            boolean emergency
    ) {}

    record Result(
            String modelId,
            String version,
            String fromStage,
            String toStage,
            Instant promotedAt
    ) {}

    Result execute(Command cmd);
}
