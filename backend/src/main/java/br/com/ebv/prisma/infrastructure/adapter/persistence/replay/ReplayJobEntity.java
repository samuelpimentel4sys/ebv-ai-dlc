package br.com.ebv.prisma.infrastructure.adapter.persistence.replay;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_replay_job")
public class ReplayJobEntity {

    @Id
    private UUID id;

    @Column(name = "window_start", nullable = false)
    private OffsetDateTime windowStart;

    @Column(name = "window_end", nullable = false)
    private OffsetDateTime windowEnd;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false)
    private UUID requester;

    @Column(nullable = false)
    private UUID approver;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Column(name = "output_uri", columnDefinition = "TEXT")
    private String outputUri;

    @Column(name = "target_env", nullable = false, length = 20)
    private String targetEnv;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public OffsetDateTime getWindowStart() { return windowStart; }
    public void setWindowStart(OffsetDateTime windowStart) { this.windowStart = windowStart; }
    public OffsetDateTime getWindowEnd() { return windowEnd; }
    public void setWindowEnd(OffsetDateTime windowEnd) { this.windowEnd = windowEnd; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public UUID getRequester() { return requester; }
    public void setRequester(UUID requester) { this.requester = requester; }
    public UUID getApprover() { return approver; }
    public void setApprover(UUID approver) { this.approver = approver; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
    public String getOutputUri() { return outputUri; }
    public void setOutputUri(String outputUri) { this.outputUri = outputUri; }
    public String getTargetEnv() { return targetEnv; }
    public void setTargetEnv(String targetEnv) { this.targetEnv = targetEnv; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
}
