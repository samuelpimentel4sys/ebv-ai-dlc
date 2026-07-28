package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_tf_monitoring_run")
public class TfMonitoringRunEntity {
    @Id @Column(name = "run_id") private UUID runId;
    @Column(name = "model_version", nullable = false) private String modelVersion;
    @Column(name = "started_at", nullable = false) private OffsetDateTime startedAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    @Column(nullable = false) private String status;
    @Column(name = "auc_current") private BigDecimal aucCurrent;
    @Column(name = "auc_baseline") private BigDecimal aucBaseline;
    @Column(name = "degradation_pct") private BigDecimal degradationPct;

    public UUID getRunId() { return runId; }
    public void setRunId(UUID runId) { this.runId = runId; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getAucCurrent() { return aucCurrent; }
    public void setAucCurrent(BigDecimal aucCurrent) { this.aucCurrent = aucCurrent; }
    public BigDecimal getAucBaseline() { return aucBaseline; }
    public void setAucBaseline(BigDecimal aucBaseline) { this.aucBaseline = aucBaseline; }
    public BigDecimal getDegradationPct() { return degradationPct; }
    public void setDegradationPct(BigDecimal degradationPct) { this.degradationPct = degradationPct; }
}
