package br.com.ebv.prisma.infrastructure.adapter.persistence.scoring;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_model_promotion")
public class ModelPromotionEntity {

    @Id
    private UUID id;

    @Column(name = "model_id", length = 80, nullable = false)
    private String modelId;

    @Column(length = 40, nullable = false)
    private String version;

    @Column(name = "from_stage", length = 20, nullable = false)
    private String fromStage;

    @Column(name = "to_stage", length = 20, nullable = false)
    private String toStage;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String approvers;

    @Column(name = "at", nullable = false)
    private OffsetDateTime at;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = modelId; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getFromStage() { return fromStage; }
    public void setFromStage(String fromStage) { this.fromStage = fromStage; }
    public String getToStage() { return toStage; }
    public void setToStage(String toStage) { this.toStage = toStage; }
    public String getApprovers() { return approvers; }
    public void setApprovers(String approvers) { this.approvers = approvers; }
    public OffsetDateTime getAt() { return at; }
    public void setAt(OffsetDateTime at) { this.at = at; }
}
