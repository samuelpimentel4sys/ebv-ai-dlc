package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface PfLimitJpaRepository extends JpaRepository<PfLimitEntity, UUID> {
    List<PfLimitEntity> findByPortfolioId(UUID portfolioId);
    Optional<PfLimitEntity> findByPortfolioIdAndDimension(UUID portfolioId, String dimension);
}
