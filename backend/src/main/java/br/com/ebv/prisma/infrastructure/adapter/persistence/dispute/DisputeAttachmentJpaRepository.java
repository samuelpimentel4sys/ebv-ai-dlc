package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisputeAttachmentJpaRepository extends JpaRepository<DisputeAttachmentEntity, UUID> {

    List<DisputeAttachmentEntity> findByDisputeIdOrderByCreatedAtAsc(UUID disputeId);

    boolean existsByStorageUri(String storageUri);
}
