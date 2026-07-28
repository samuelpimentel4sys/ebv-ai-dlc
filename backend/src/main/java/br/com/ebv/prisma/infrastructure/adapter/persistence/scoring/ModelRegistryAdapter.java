package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ModelRegistryAdapter implements ModelRegistryPort {

    private final ModelVersionJpaRepository versionJpa;
    private final ModelPromotionJpaRepository promotionJpa;

    public ModelRegistryAdapter(
            ModelVersionJpaRepository versionJpa,
            ModelPromotionJpaRepository promotionJpa
    ) {
        this.versionJpa = versionJpa;
        this.promotionJpa = promotionJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModelVersion> listAll() {
        return versionJpa.findAllByOrderByModelIdAscCreatedAtDesc().stream()
                .map(this::toRecord)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ModelVersion> find(String modelId, String version) {
        return versionJpa.findByModelIdAndVersion(modelId, version).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ModelVersion> findProduction(String modelId) {
        return versionJpa.findFirstByModelIdAndStageOrderByCreatedAtDesc(modelId, "PRODUCTION")
                .map(this::toRecord);
    }

    @Override
    public void updateStage(String modelId, String version, String newStage) {
        versionJpa.findByModelIdAndVersion(modelId, version).ifPresent(e -> {
            e.setStage(newStage);
            versionJpa.save(e);
        });
    }

    @Override
    public void savePromotion(String modelId, String version, String fromStage, String toStage, List<String> approvers) {
        ModelPromotionEntity e = new ModelPromotionEntity();
        e.setId(UUID.randomUUID());
        e.setModelId(modelId);
        e.setVersion(version);
        e.setFromStage(fromStage);
        e.setToStage(toStage);
        e.setApprovers(String.join(",", approvers));
        e.setAt(OffsetDateTime.now(ZoneOffset.UTC));
        promotionJpa.save(e);
    }

    private ModelVersion toRecord(ModelVersionEntity e) {
        Instant createdAt = e.getCreatedAt() != null
                ? e.getCreatedAt().toInstant()
                : Instant.now();
        return new ModelVersion(
                e.getModelId(),
                e.getVersion(),
                e.getStage(),
                e.getArtifactUri(),
                e.getMetricsJson(),
                e.isImmutable(),
                createdAt
        );
    }
}
