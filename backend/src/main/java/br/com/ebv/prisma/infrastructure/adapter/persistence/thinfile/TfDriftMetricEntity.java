package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tb_tf_drift_metric")
public class TfDriftMetricEntity {
    @Id @Column(name = "metric_id") private UUID metricId;
    @Column(name = "run_id", nullable = false) private UUID runId;
    @Column(name = "feature_name", nullable = false) private String featureName;
    @Column(nullable = false) private BigDecimal psi;
    @Column(name = "vulnerable_segment", nullable = false) private Boolean vulnerableSegment;
    @Column(nullable = false) private String severity;

    public UUID getMetricId() { return metricId; }
    public void setMetricId(UUID metricId) { this.metricId = metricId; }
    public UUID getRunId() { return runId; }
    public void setRunId(UUID runId) { this.runId = runId; }
    public String getFeatureName() { return featureName; }
    public void setFeatureName(String featureName) { this.featureName = featureName; }
    public BigDecimal getPsi() { return psi; }
    public void setPsi(BigDecimal psi) { this.psi = psi; }
    public Boolean getVulnerableSegment() { return vulnerableSegment; }
    public void setVulnerableSegment(Boolean vulnerableSegment) { this.vulnerableSegment = vulnerableSegment; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}
