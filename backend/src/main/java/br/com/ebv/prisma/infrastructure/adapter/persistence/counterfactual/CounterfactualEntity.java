package br.com.ebv.prisma.infrastructure.adapter.persistence.counterfactual;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_counterfactual")
public class CounterfactualEntity {

    @Id
    @Column(name = "decision_id")
    private UUID decisionId;

    @Column(name = "actions_json", nullable = false, columnDefinition = "TEXT")
    private String actionsJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getDecisionId() { return decisionId; }
    public void setDecisionId(UUID decisionId) { this.decisionId = decisionId; }
    public String getActionsJson() { return actionsJson; }
    public void setActionsJson(String actionsJson) { this.actionsJson = actionsJson; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
