package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tb_thinfile_model_card")
public class ThinfileModelCardEntity {
    @Id @Column(name = "model_version") private String modelVersion;
    @Column(name = "trained_at", nullable = false) private OffsetDateTime trainedAt;
    @Column(name = "validated_at", nullable = false) private OffsetDateTime validatedAt;
    @Column(name = "population_desc", nullable = false) private String populationDesc;
    private BigDecimal auc;
    @Column(name = "confidence_floor", nullable = false) private BigDecimal confidenceFloor;
    @Column(name = "limitations_json", nullable = false) private String limitationsJson;
    @Column(nullable = false) private Boolean active;

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public OffsetDateTime getTrainedAt() { return trainedAt; }
    public void setTrainedAt(OffsetDateTime trainedAt) { this.trainedAt = trainedAt; }
    public OffsetDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(OffsetDateTime validatedAt) { this.validatedAt = validatedAt; }
    public String getPopulationDesc() { return populationDesc; }
    public void setPopulationDesc(String populationDesc) { this.populationDesc = populationDesc; }
    public BigDecimal getAuc() { return auc; }
    public void setAuc(BigDecimal auc) { this.auc = auc; }
    public BigDecimal getConfidenceFloor() { return confidenceFloor; }
    public void setConfidenceFloor(BigDecimal confidenceFloor) { this.confidenceFloor = confidenceFloor; }
    public String getLimitationsJson() { return limitationsJson; }
    public void setLimitationsJson(String limitationsJson) { this.limitationsJson = limitationsJson; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
