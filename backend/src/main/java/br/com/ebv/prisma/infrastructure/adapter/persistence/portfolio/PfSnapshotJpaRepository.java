package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;

public interface PfSnapshotJpaRepository extends JpaRepository<PfSnapshotEntity, UUID> {
    Optional<PfSnapshotEntity> findByPortfolioIdAndAsOfDate(UUID portfolioId, java.time.LocalDate asOfDate);
}
