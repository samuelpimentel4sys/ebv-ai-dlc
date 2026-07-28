package br.com.ebv.prisma.infrastructure.adapter.persistence.mission;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mission_catalog")
public class MissionCatalogEntity {
    @Id @Column(name = "mission_id") private UUID missionId;
    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String title;
    @Column(name = "rules_json", nullable = false) private String rulesJson;
    @Column(name = "reward_type", nullable = false) private String rewardType;
    @Column(nullable = false) private Boolean active;
    @Column(nullable = false) private Integer version;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;

    public UUID getMissionId() { return missionId; }
    public void setMissionId(UUID missionId) { this.missionId = missionId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getRulesJson() { return rulesJson; }
    public void setRulesJson(String rulesJson) { this.rulesJson = rulesJson; }
    public String getRewardType() { return rewardType; }
    public void setRewardType(String rewardType) { this.rewardType = rewardType; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
