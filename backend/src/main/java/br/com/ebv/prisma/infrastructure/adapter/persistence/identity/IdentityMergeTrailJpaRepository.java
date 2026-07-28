package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IdentityMergeTrailJpaRepository extends JpaRepository<IdentityMergeTrailEntity, UUID> {
    List<IdentityMergeTrailEntity> findByAction(String action);

    List<IdentityMergeTrailEntity> findByFromGrAndToGrOrderByAtAsc(UUID fromGr, UUID toGr);
}
