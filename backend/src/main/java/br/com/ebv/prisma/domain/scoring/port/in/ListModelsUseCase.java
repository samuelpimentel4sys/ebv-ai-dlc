package br.com.ebv.prisma.domain.scoring.port.in;

import java.time.Instant;
import java.util.List;

public interface ListModelsUseCase {

    record ModelSummary(
            String modelId,
            String version,
            String stage,
            String artifactUri,
            String metricsJson,
            boolean immutable,
            Instant createdAt
    ) {}

    List<ModelSummary> execute();
}
