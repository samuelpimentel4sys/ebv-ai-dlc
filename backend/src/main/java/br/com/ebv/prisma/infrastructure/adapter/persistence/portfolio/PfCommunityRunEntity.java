package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_community_run")
public class PfCommunityRunEntity {
    @Id @Column(name = "run_id", length = 40) private String runId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(nullable = false, length = 40) private String algorithm;
    @Column(name = "min_community_size", nullable = false) private int minCommunitySize;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    public String getRunId() { return runId; }
    public void setRunId(String v) { runId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String v) { algorithm = v; }
    public int getMinCommunitySize() { return minCommunitySize; }
    public void setMinCommunitySize(int v) { minCommunitySize = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime v) { finishedAt = v; }
}
