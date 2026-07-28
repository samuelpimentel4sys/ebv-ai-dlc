package br.com.ebv.prisma.infrastructure.adapter.persistence.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_pf_alert")
public class PfAlertEntity {
    @Id @Column(name = "alert_id") private UUID alertId;
    @Column(name = "portfolio_id", nullable = false) private UUID portfolioId;
    @Column(nullable = false, length = 40) private String dimension;
    @Column(name = "dim_key", nullable = false, length = 80) private String dimKey;
    @Column(nullable = false, length = 20) private String severity;
    @Column(nullable = false, length = 20) private String status;
    @Column(nullable = false, length = 255) private String message;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID v) { alertId = v; }
    public UUID getPortfolioId() { return portfolioId; }
    public void setPortfolioId(UUID v) { portfolioId = v; }
    public String getDimension() { return dimension; }
    public void setDimension(String v) { dimension = v; }
    public String getDimKey() { return dimKey; }
    public void setDimKey(String v) { dimKey = v; }
    public String getSeverity() { return severity; }
    public void setSeverity(String v) { severity = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { status = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { message = v; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime v) { createdAt = v; }
}
