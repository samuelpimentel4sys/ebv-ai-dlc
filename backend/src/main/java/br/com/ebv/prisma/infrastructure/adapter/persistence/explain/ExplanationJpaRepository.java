package br.com.ebv.prisma.infrastructure.adapter.persistence.explain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ExplanationJpaRepository extends JpaRepository<ExplanationEntity, UUID> {

    List<ExplanationEntity> findByDecisionIdIn(Collection<UUID> decisionIds);
}
