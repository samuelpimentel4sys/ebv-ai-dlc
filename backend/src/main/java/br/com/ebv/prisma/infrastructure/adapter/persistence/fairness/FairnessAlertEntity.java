package br.com.ebv.prisma.infrastructure.adapter.persistence.fairness;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_fairness_alert")
public class FairnessAlertEntity {

    @Id
    private UUID id;

    @Column(name = "metric_id")
    private UUID metricId;

    @Column(name = "model_version", nullable = false, length = 80)
    private String modelVersion;

    @Column(nullable = false, length = 12)
    private String severity;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "opened_at", nullable = false)
    private OffsetDateTime openedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getMetricId() { return metricId; }
    public void setMetricId(UUID metricId) { this.metricId = metricId; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public OffsetDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(OffsetDateTime openedAt) { this.openedAt = openedAt; }
}
