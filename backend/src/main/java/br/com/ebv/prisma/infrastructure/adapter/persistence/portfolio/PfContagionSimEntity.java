package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_contagion_sim")
public class PfContagionSimEntity {
    @Id @Column(name = "sim_id", length = 40) private String simId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(name = "origin_node_id", nullable = false, length = 80) private String originNodeId;
    @Column(name = "transmission_factor", nullable = false) private BigDecimal transmissionFactor;
    @Column(name = "max_waves", nullable = false) private int maxWaves;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "premises_json") private String premisesJson;
    @Column(name = "result_json") private String resultJson;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    public String getSimId() { return simId; }
    public void setSimId(String v) { simId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public String getOriginNodeId() { return originNodeId; }
    public void setOriginNodeId(String v) { originNodeId = v; }
    public BigDecimal getTransmissionFactor() { return transmissionFactor; }
    public void setTransmissionFactor(BigDecimal v) { transmissionFactor = v; }
    public int getMaxWaves() { return maxWaves; }
    public void setMaxWaves(int v) { maxWaves = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getPremisesJson() { return premisesJson; }
    public void setPremisesJson(String v) { premisesJson = v; }
    public String getResultJson() { return resultJson; }
    public void setResultJson(String v) { resultJson = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime v) { finishedAt = v; }
}
