package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_coach_journey")
public class CoachJourneyEntity {
    @Id @Column(name = "journey_id") private UUID journeyId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(nullable = false) private String status;
    @Column(name = "started_at", nullable = false) private OffsetDateTime startedAt;
    @Column(name = "decision_snapshot_id") private UUID decisionSnapshotId;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;

    public UUID getJourneyId() { return journeyId; }
    public void setJourneyId(UUID journeyId) { this.journeyId = journeyId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public UUID getDecisionSnapshotId() { return decisionSnapshotId; }
    public void setDecisionSnapshotId(UUID decisionSnapshotId) { this.decisionSnapshotId = decisionSnapshotId; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
