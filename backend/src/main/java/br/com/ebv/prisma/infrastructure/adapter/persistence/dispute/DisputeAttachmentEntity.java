package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_dispute_attachment")
public class DisputeAttachmentEntity {

    @Id
    private UUID id;

    @Column(name = "dispute_id", nullable = false)
    private UUID disputeId;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "storage_uri", nullable = false, columnDefinition = "TEXT")
    private String storageUri;

    @Column(name = "prev_attachment_id")
    private UUID prevAttachmentId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getDisputeId() { return disputeId; }
    public void setDisputeId(UUID disputeId) { this.disputeId = disputeId; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public String getSha256() { return sha256; }
    public void setSha256(String sha256) { this.sha256 = sha256; }
    public String getStorageUri() { return storageUri; }
    public void setStorageUri(String storageUri) { this.storageUri = storageUri; }
    public UUID getPrevAttachmentId() { return prevAttachmentId; }
    public void setPrevAttachmentId(UUID prevAttachmentId) { this.prevAttachmentId = prevAttachmentId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
