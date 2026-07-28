package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PjApprovalTrailJpaRepository extends JpaRepository<PjApprovalTrailEntity, UUID> {
    List<PjApprovalTrailEntity> findByOpinionIdOrderByAtAsc(UUID opinionId);
}
