package br.com.ebv.prisma.infrastructure.adapter.persistence.review;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_review")
public class ReviewEntity {

    @Id
    private UUID id;

    @Column(name = "decision_id", nullable = false)
    private UUID decisionId;

    @Column(name = "subject_token", nullable = false, length = 128)
    private String subjectToken;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false, length = 32)
    private String channel;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 128)
    private String assignee;

    @Column(name = "due_at", nullable = false)
    private OffsetDateTime dueAt;

    @Column(length = 20)
    private String outcome;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    @Column(name = "reviewed_factors_json", columnDefinition = "TEXT")
    private String reviewedFactorsJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getDecisionId() { return decisionId; }
    public void setDecisionId(UUID decisionId) { this.decisionId = decisionId; }
    public String getSubjectToken() { return subjectToken; }
    public void setSubjectToken(String subjectToken) { this.subjectToken = subjectToken; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public OffsetDateTime getDueAt() { return dueAt; }
    public void setDueAt(OffsetDateTime dueAt) { this.dueAt = dueAt; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }
    public String getReviewedFactorsJson() { return reviewedFactorsJson; }
    public void setReviewedFactorsJson(String reviewedFactorsJson) { this.reviewedFactorsJson = reviewedFactorsJson; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(OffsetDateTime decidedAt) { this.decidedAt = decidedAt; }
}
