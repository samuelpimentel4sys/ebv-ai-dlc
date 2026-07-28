package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import br.com.ebv.prisma.domain.dispute.port.out.DisputeAttachmentRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class DisputeAttachmentRepositoryAdapter implements DisputeAttachmentRepositoryPort {

    private final DisputeAttachmentJpaRepository jpa;

    public DisputeAttachmentRepositoryAdapter(DisputeAttachmentJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public void save(AttachmentRecord record) {
        DisputeAttachmentEntity e = new DisputeAttachmentEntity();
        e.setId(record.id());
        e.setDisputeId(record.disputeId());
        e.setFilename(record.filename());
        e.setContentType(record.contentType());
        e.setSha256(record.sha256());
        e.setStorageUri(record.storageUri());
        e.setPrevAttachmentId(record.prevAttachmentId());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        jpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentRecord> findByDisputeId(UUID disputeId) {
        return jpa.findByDisputeIdOrderByCreatedAtAsc(disputeId).stream().map(this::toRecord).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AttachmentRecord> findById(UUID id) {
        return jpa.findById(id).map(this::toRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsStorageUri(String storageUri) {
        return jpa.existsByStorageUri(storageUri);
    }

    private AttachmentRecord toRecord(DisputeAttachmentEntity e) {
        return new AttachmentRecord(
                e.getId(), e.getDisputeId(), e.getFilename(), e.getContentType(),
                e.getSha256(), e.getStorageUri(), e.getPrevAttachmentId(),
                e.getCreatedAt().toInstant()
        );
    }
}
