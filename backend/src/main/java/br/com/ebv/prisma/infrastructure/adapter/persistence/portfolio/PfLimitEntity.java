package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_limit")
public class PfLimitEntity {
    @Id @Column(name = "limit_id") private UUID limitId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(nullable = false, length = 40) private String dimension;
    @Column(name = "threshold_pct", nullable = false) private BigDecimal thresholdPct;
    @Column(name = "warn_pct", nullable = false) private BigDecimal warnPct;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;
    public UUID getLimitId() { return limitId; }
    public void setLimitId(UUID v) { limitId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public String getDimension() { return dimension; }
    public void setDimension(String v) { dimension = v; }
    public BigDecimal getThresholdPct() { return thresholdPct; }
    public void setThresholdPct(BigDecimal v) { thresholdPct = v; }
    public BigDecimal getWarnPct() { return warnPct; }
    public void setWarnPct(BigDecimal v) { warnPct = v; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime v) { updatedAt = v; }
}
