package br.com.ebv.prisma.infrastructure.adapter.persistence.observability;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_decision_trace")
public class DecisionTraceEntity {

    @Id
    @Column(name = "decision_id")
    private UUID decisionId;

    @Column(name = "client_id", length = 64)
    private String clientId;

    @Column(name = "span_json", nullable = false, columnDefinition = "TEXT")
    private String spanJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    public UUID getDecisionId() { return decisionId; }
    public void setDecisionId(UUID decisionId) { this.decisionId = decisionId; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public String getSpanJson() { return spanJson; }
    public void setSpanJson(String spanJson) { this.spanJson = spanJson; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
