package br.com.ebv.prisma.infrastructure.adapter.persistence.features;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeatureCatalogJpaRepository extends JpaRepository<FeatureCatalogEntity, String> {
    List<FeatureCatalogEntity> findByActiveTrueOrderByNameAsc();
}
