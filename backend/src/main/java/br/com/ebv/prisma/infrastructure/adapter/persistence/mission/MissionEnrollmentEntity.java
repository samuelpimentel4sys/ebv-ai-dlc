package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mission_enrollment")
public class MissionEnrollmentEntity {
    @Id @Column(name = "enrollment_id") private UUID enrollmentId;
    @Column(name = "mission_id", nullable = false) private UUID missionId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(nullable = false) private String status;
    @Column(name = "progress_pct", nullable = false) private BigDecimal progressPct;
    @Column(name = "enrolled_at", nullable = false) private OffsetDateTime enrolledAt;

    public UUID getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(UUID enrollmentId) { this.enrollmentId = enrollmentId; }
    public UUID getMissionId() { return missionId; }
    public void setMissionId(UUID missionId) { this.missionId = missionId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getProgressPct() { return progressPct; }
    public void setProgressPct(BigDecimal progressPct) { this.progressPct = progressPct; }
    public OffsetDateTime getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(OffsetDateTime enrolledAt) { this.enrolledAt = enrolledAt; }
}
