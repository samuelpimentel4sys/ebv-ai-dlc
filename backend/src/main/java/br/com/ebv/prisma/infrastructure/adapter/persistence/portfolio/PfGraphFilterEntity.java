package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_graph_filter")
public class PfGraphFilterEntity {
    @Id @Column(name = "filter_id") private UUID filterId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(nullable = false) private int lod;
    @Column(name = "max_nodes", nullable = false) private int maxNodes;
    @Column(name = "criteria_json") private String criteriaJson;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    public UUID getFilterId() { return filterId; }
    public void setFilterId(UUID v) { filterId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public int getLod() { return lod; }
    public void setLod(int v) { lod = v; }
    public int getMaxNodes() { return maxNodes; }
    public void setMaxNodes(int v) { maxNodes = v; }
    public String getCriteriaJson() { return criteriaJson; }
    public void setCriteriaJson(String v) { criteriaJson = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
}
