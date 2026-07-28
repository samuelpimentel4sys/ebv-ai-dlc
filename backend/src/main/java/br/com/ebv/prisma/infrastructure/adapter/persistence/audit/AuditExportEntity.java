package br.com.ebv.prisma.infrastructure.adapter.persistence.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_audit_export")
public class AuditExportEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, length = 8)
    private String format;

    @Column(nullable = false, length = 120)
    private String purpose;

    @Column(name = "manifest_hash", nullable = false, length = 128)
    private String manifestHash;

    @Column(name = "retention_until", nullable = false)
    private LocalDate retentionUntil;

    @Column(name = "requested_at", nullable = false)
    private OffsetDateTime requestedAt;

    @Column(name = "filters_json", nullable = false, columnDefinition = "TEXT")
    private String filtersJson;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getManifestHash() { return manifestHash; }
    public void setManifestHash(String manifestHash) { this.manifestHash = manifestHash; }
    public LocalDate getRetentionUntil() { return retentionUntil; }
    public void setRetentionUntil(LocalDate retentionUntil) { this.retentionUntil = retentionUntil; }
    public OffsetDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(OffsetDateTime requestedAt) { this.requestedAt = requestedAt; }
    public String getFiltersJson() { return filtersJson; }
    public void setFiltersJson(String filtersJson) { this.filtersJson = filtersJson; }
}
