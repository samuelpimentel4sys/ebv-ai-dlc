package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface PfCommunityJpaRepository extends JpaRepository<PfCommunityEntity, String> {
    List<PfCommunityEntity> findByPortfolioId(UUID portfolioId);
}
