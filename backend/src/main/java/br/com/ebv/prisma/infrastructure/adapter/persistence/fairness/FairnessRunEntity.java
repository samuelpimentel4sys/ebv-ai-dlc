package br.com.ebv.prisma.infrastructure.adapter.persistence.fairness;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_fairness_run")
public class FairnessRunEntity {

    @Id
    private UUID id;

    @Column(name = "model_version", nullable = false, length = 80)
    private String modelVersion;

    @Column(name = "window_from")
    private LocalDate windowFrom;

    @Column(name = "window_to")
    private LocalDate windowTo;

    @Column(name = "threshold_profile", length = 60)
    private String thresholdProfile;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "segments_json", columnDefinition = "TEXT")
    private String segmentsJson;

    @Column(name = "metrics_requested_json", columnDefinition = "TEXT")
    private String metricsRequestedJson;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public LocalDate getWindowFrom() { return windowFrom; }
    public void setWindowFrom(LocalDate windowFrom) { this.windowFrom = windowFrom; }
    public LocalDate getWindowTo() { return windowTo; }
    public void setWindowTo(LocalDate windowTo) { this.windowTo = windowTo; }
    public String getThresholdProfile() { return thresholdProfile; }
    public void setThresholdProfile(String thresholdProfile) { this.thresholdProfile = thresholdProfile; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSegmentsJson() { return segmentsJson; }
    public void setSegmentsJson(String segmentsJson) { this.segmentsJson = segmentsJson; }
    public String getMetricsRequestedJson() { return metricsRequestedJson; }
    public void setMetricsRequestedJson(String metricsRequestedJson) { this.metricsRequestedJson = metricsRequestedJson; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(OffsetDateTime submittedAt) { this.submittedAt = submittedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
}
