package br.com.ebv.prisma.infrastructure.adapter.persistence.policysim;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_policy_simulation")
public class PolicySimulationEntity {

    @Id
    private UUID id;

    @Column(name = "candidate_policy", nullable = false, columnDefinition = "TEXT")
    private String candidatePolicy;

    @Column(name = "sample_ref", nullable = false, length = 120)
    private String sampleRef;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "metrics_json", columnDefinition = "TEXT")
    private String metricsJson;

    @Column(name = "result_json", columnDefinition = "TEXT")
    private String resultJson;

    @Column(name = "baseline_version", length = 80)
    private String baselineVersion;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCandidatePolicy() { return candidatePolicy; }
    public void setCandidatePolicy(String candidatePolicy) { this.candidatePolicy = candidatePolicy; }
    public String getSampleRef() { return sampleRef; }
    public void setSampleRef(String sampleRef) { this.sampleRef = sampleRef; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMetricsJson() { return metricsJson; }
    public void setMetricsJson(String metricsJson) { this.metricsJson = metricsJson; }
    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }
    public String getBaselineVersion() { return baselineVersion; }
    public void setBaselineVersion(String baselineVersion) { this.baselineVersion = baselineVersion; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
}
