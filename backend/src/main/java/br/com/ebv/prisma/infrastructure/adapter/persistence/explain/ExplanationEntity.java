package br.com.ebv.prisma.infrastructure.adapter.persistence.explain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_explanation")
public class ExplanationEntity {

    @Id
    @Column(name = "decision_id")
    private UUID decisionId;

    @Column(name = "base_value", precision = 12, scale = 6)
    private BigDecimal baseValue;

    @Column(name = "factors_json", nullable = false, columnDefinition = "TEXT")
    private String factorsJson;

    @Column(name = "model_version", length = 40)
    private String modelVersion;

    @Column(nullable = false)
    private boolean immutable = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getDecisionId() { return decisionId; }
    public void setDecisionId(UUID decisionId) { this.decisionId = decisionId; }
    public BigDecimal getBaseValue() { return baseValue; }
    public void setBaseValue(BigDecimal baseValue) { this.baseValue = baseValue; }
    public String getFactorsJson() { return factorsJson; }
    public void setFactorsJson(String factorsJson) { this.factorsJson = factorsJson; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public boolean isImmutable() { return immutable; }
    public void setImmutable(boolean immutable) { this.immutable = immutable; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
