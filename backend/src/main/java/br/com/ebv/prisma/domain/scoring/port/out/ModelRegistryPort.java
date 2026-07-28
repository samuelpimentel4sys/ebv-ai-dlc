package br.com.ebv.prisma.domain.scoring.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ModelRegistryPort {

    record ModelVersion(
            String modelId,
            String version,
            String stage,
            String artifactUri,
            String metricsJson,
            boolean immutable,
            Instant createdAt
    ) {}

    List<ModelVersion> listAll();

    Optional<ModelVersion> find(String modelId, String version);

    Optional<ModelVersion> findProduction(String modelId);

    void updateStage(String modelId, String version, String newStage);

    void savePromotion(String modelId, String version, String fromStage, String toStage, List<String> approvers);
}
