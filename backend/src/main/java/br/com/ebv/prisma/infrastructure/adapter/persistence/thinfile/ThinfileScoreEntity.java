package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_thinfile_score")
public class ThinfileScoreEntity {
    @Id @Column(name = "score_id") private UUID scoreId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "model_version", nullable = false) private String modelVersion;
    @Column(name = "score_value", nullable = false) private Integer scoreValue;
    @Column(name = "confidence_band", nullable = false) private String confidenceBand;
    @Column(name = "thin_file_flag", nullable = false) private Boolean thinFileFlag;
    @Column(name = "routed_to_traditional", nullable = false) private Boolean routedToTraditional;
    @Column(name = "calculated_at", nullable = false) private OffsetDateTime calculatedAt;
    @Column(name = "correlation_id", nullable = false) private UUID correlationId;

    public UUID getScoreId() { return scoreId; }
    public void setScoreId(UUID scoreId) { this.scoreId = scoreId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public Integer getScoreValue() { return scoreValue; }
    public void setScoreValue(Integer scoreValue) { this.scoreValue = scoreValue; }
    public String getConfidenceBand() { return confidenceBand; }
    public void setConfidenceBand(String confidenceBand) { this.confidenceBand = confidenceBand; }
    public Boolean getThinFileFlag() { return thinFileFlag; }
    public void setThinFileFlag(Boolean thinFileFlag) { this.thinFileFlag = thinFileFlag; }
    public Boolean getRoutedToTraditional() { return routedToTraditional; }
    public void setRoutedToTraditional(Boolean routedToTraditional) { this.routedToTraditional = routedToTraditional; }
    public OffsetDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(OffsetDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
    public UUID getCorrelationId() { return correlationId; }
    public void setCorrelationId(UUID correlationId) { this.correlationId = correlationId; }
}
