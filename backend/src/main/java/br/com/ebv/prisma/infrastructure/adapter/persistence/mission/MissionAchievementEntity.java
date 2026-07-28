package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mission_achievement")
public class MissionAchievementEntity {
    @Id @Column(name = "achievement_id") private UUID achievementId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "mission_id", nullable = false) private UUID missionId;
    @Column(nullable = false) private String code;
    @Column(nullable = false) private String title;
    @Column(name = "earned_at", nullable = false) private OffsetDateTime earnedAt;

    public UUID getAchievementId() { return achievementId; }
    public void setAchievementId(UUID achievementId) { this.achievementId = achievementId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public UUID getMissionId() { return missionId; }
    public void setMissionId(UUID missionId) { this.missionId = missionId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public OffsetDateTime getEarnedAt() { return earnedAt; }
    public void setEarnedAt(OffsetDateTime earnedAt) { this.earnedAt = earnedAt; }
}
