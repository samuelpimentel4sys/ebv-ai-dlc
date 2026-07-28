package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_community")
public class PfCommunityEntity {
    @Id @Column(name = "community_id", length = 40) private String communityId;
    @Column(name = "run_id", nullable = false, length = 40) private String runId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(length = 120) private String label;
    @Column(name = "total_exposure", nullable = false) private BigDecimal totalExposure;
    @Column(name = "member_count", nullable = false) private int memberCount;
    @Column(name = "members_json") private String membersJson;
    public String getCommunityId() { return communityId; }
    public void setCommunityId(String v) { communityId = v; }
    public String getRunId() { return runId; }
    public void setRunId(String v) { runId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public String getLabel() { return label; }
    public void setLabel(String v) { label = v; }
    public BigDecimal getTotalExposure() { return totalExposure; }
    public void setTotalExposure(BigDecimal v) { totalExposure = v; }
    public int getMemberCount() { return memberCount; }
    public void setMemberCount(int v) { memberCount = v; }
    public String getMembersJson() { return membersJson; }
    public void setMembersJson(String v) { membersJson = v; }
}
