package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PfStressScenarioJpaRepository extends JpaRepository<PfStressScenarioEntity, UUID> {
}
