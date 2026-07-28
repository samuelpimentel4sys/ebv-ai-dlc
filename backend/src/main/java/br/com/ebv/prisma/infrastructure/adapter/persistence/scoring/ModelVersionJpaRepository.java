package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ModelVersionJpaRepository extends JpaRepository<ModelVersionEntity, ModelVersionEntity.Pk> {

    Optional<ModelVersionEntity> findByModelIdAndVersion(String modelId, String version);

    Optional<ModelVersionEntity> findFirstByModelIdAndStageOrderByCreatedAtDesc(String modelId, String stage);

    List<ModelVersionEntity> findAllByOrderByModelIdAscCreatedAtDesc();
}
