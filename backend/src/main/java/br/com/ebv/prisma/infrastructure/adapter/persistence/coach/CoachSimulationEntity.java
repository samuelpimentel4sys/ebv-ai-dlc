package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_coach_simulation")
public class CoachSimulationEntity {
    @Id @Column(name = "simulation_id") private UUID simulationId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "snapshot_score_id", nullable = false) private UUID snapshotScoreId;
    @Column(name = "action_code", nullable = false) private String actionCode;
    @Column(nullable = false) private Boolean estimable;
    @Column(name = "score_delta_min") private Integer scoreDeltaMin;
    @Column(name = "score_delta_max") private Integer scoreDeltaMax;
    @Column(name = "effect_days_min") private Integer effectDaysMin;
    @Column(name = "effect_days_max") private Integer effectDaysMax;
    @Column(nullable = false) private String message;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getSimulationId() { return simulationId; }
    public void setSimulationId(UUID simulationId) { this.simulationId = simulationId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public UUID getSnapshotScoreId() { return snapshotScoreId; }
    public void setSnapshotScoreId(UUID snapshotScoreId) { this.snapshotScoreId = snapshotScoreId; }
    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public Boolean getEstimable() { return estimable; }
    public void setEstimable(Boolean estimable) { this.estimable = estimable; }
    public Integer getScoreDeltaMin() { return scoreDeltaMin; }
    public void setScoreDeltaMin(Integer scoreDeltaMin) { this.scoreDeltaMin = scoreDeltaMin; }
    public Integer getScoreDeltaMax() { return scoreDeltaMax; }
    public void setScoreDeltaMax(Integer scoreDeltaMax) { this.scoreDeltaMax = scoreDeltaMax; }
    public Integer getEffectDaysMin() { return effectDaysMin; }
    public void setEffectDaysMin(Integer effectDaysMin) { this.effectDaysMin = effectDaysMin; }
    public Integer getEffectDaysMax() { return effectDaysMax; }
    public void setEffectDaysMax(Integer effectDaysMax) { this.effectDaysMax = effectDaysMax; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
