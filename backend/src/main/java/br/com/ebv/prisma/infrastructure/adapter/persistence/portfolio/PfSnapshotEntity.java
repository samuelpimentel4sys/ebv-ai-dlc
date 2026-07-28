package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_snapshot")
public class PfSnapshotEntity {
    @Id @Column(name = "snapshot_id") private UUID snapshotId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(name = "as_of_date", nullable = false) private LocalDate asOfDate;
    @Column(name = "aggregate_version", nullable = false, length = 80) private String aggregateVersion;
    @Column(name = "summary_json", nullable = false) private String summaryJson;
    @Column(name = "node_count", nullable = false) private int nodeCount;
    @Column(name = "divergence_flag", nullable = false) private boolean divergenceFlag;
    public UUID getSnapshotId() { return snapshotId; }
    public void setSnapshotId(UUID v) { snapshotId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public LocalDate getAsOfDate() { return asOfDate; }
    public void setAsOfDate(LocalDate v) { asOfDate = v; }
    public String getAggregateVersion() { return aggregateVersion; }
    public void setAggregateVersion(String v) { aggregateVersion = v; }
    public String getSummaryJson() { return summaryJson; }
    public void setSummaryJson(String v) { summaryJson = v; }
    public int getNodeCount() { return nodeCount; }
    public void setNodeCount(int v) { nodeCount = v; }
    public boolean isDivergenceFlag() { return divergenceFlag; }
    public void setDivergenceFlag(boolean v) { divergenceFlag = v; }
}
