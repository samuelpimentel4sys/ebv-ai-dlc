package br.com.ebv.prisma.infrastructure.adapter.persistence.dispute;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_dispute")
public class DisputeEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String protocol;

    @Column(nullable = false, length = 14)
    private String documento;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "reason_code", length = 64)
    private String reasonCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 32)
    private String channel;

    @Column(name = "due_at")
    private OffsetDateTime dueAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "resolution_outcome", length = 40)
    private String resolutionOutcome;

    @Column(name = "resolution_rationale", columnDefinition = "TEXT")
    private String resolutionRationale;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }
    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReasonCode() { return reasonCode; }
    public void setReasonCode(String reasonCode) { this.reasonCode = reasonCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public OffsetDateTime getDueAt() { return dueAt; }
    public void setDueAt(OffsetDateTime dueAt) { this.dueAt = dueAt; }
    public OffsetDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(OffsetDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getResolutionOutcome() { return resolutionOutcome; }
    public void setResolutionOutcome(String resolutionOutcome) { this.resolutionOutcome = resolutionOutcome; }
    public String getResolutionRationale() { return resolutionRationale; }
    public void setResolutionRationale(String resolutionRationale) { this.resolutionRationale = resolutionRationale; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
