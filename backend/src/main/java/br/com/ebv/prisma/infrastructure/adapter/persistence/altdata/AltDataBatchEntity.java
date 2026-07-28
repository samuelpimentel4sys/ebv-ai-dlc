package br.com.ebv.prisma.infrastructure.adapter.persistence.altdata;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_alt_data_batch")
public class AltDataBatchEntity {
    @Id @Column(name = "batch_id") private UUID batchId;
    @Column(name = "partner_code", nullable = false) private String partnerCode;
    @Column(name = "utility_type", nullable = false) private String utilityType;
    @Column(name = "source_uri", nullable = false) private String sourceUri;
    @Column(name = "received_at", nullable = false) private OffsetDateTime receivedAt;
    @Column(name = "record_count", nullable = false) private Integer recordCount;
    @Column(name = "error_rate", nullable = false) private BigDecimal errorRate;
    @Column(name = "quality_limit", nullable = false) private BigDecimal qualityLimit;
    @Column(nullable = false) private String status;
    @Column(name = "rejection_reason") private String rejectionReason;
    @Column(name = "correlation_id", nullable = false) private UUID correlationId;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getBatchId() { return batchId; }
    public void setBatchId(UUID batchId) { this.batchId = batchId; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public String getUtilityType() { return utilityType; }
    public void setUtilityType(String utilityType) { this.utilityType = utilityType; }
    public String getSourceUri() { return sourceUri; }
    public void setSourceUri(String sourceUri) { this.sourceUri = sourceUri; }
    public OffsetDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(OffsetDateTime receivedAt) { this.receivedAt = receivedAt; }
    public Integer getRecordCount() { return recordCount; }
    public void setRecordCount(Integer recordCount) { this.recordCount = recordCount; }
    public BigDecimal getErrorRate() { return errorRate; }
    public void setErrorRate(BigDecimal errorRate) { this.errorRate = errorRate; }
    public BigDecimal getQualityLimit() { return qualityLimit; }
    public void setQualityLimit(BigDecimal qualityLimit) { this.qualityLimit = qualityLimit; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public UUID getCorrelationId() { return correlationId; }
    public void setCorrelationId(UUID correlationId) { this.correlationId = correlationId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
