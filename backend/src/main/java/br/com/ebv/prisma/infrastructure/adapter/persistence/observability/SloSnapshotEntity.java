package br.com.ebv.prisma.infrastructure.adapter.persistence.observability;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tb_slo_snapshot")
public class SloSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private OffsetDateTime at;

    @Column(name = "client_id", length = 64)
    private String clientId;

    @Column(name = "p95_ms", nullable = false, precision = 10, scale = 2)
    private BigDecimal p95Ms;

    @Column(name = "p99_ms", nullable = false, precision = 10, scale = 2)
    private BigDecimal p99Ms;

    @Column(name = "error_rate", nullable = false, precision = 8, scale = 6)
    private BigDecimal errorRate;

    @Column(name = "budget_remaining_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal budgetRemainingPct;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public OffsetDateTime getAt() { return at; }
    public void setAt(OffsetDateTime at) { this.at = at; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public BigDecimal getP95Ms() { return p95Ms; }
    public void setP95Ms(BigDecimal p95Ms) { this.p95Ms = p95Ms; }
    public BigDecimal getP99Ms() { return p99Ms; }
    public void setP99Ms(BigDecimal p99Ms) { this.p99Ms = p99Ms; }
    public BigDecimal getErrorRate() { return errorRate; }
    public void setErrorRate(BigDecimal errorRate) { this.errorRate = errorRate; }
    public BigDecimal getBudgetRemainingPct() { return budgetRemainingPct; }
    public void setBudgetRemainingPct(BigDecimal budgetRemainingPct) { this.budgetRemainingPct = budgetRemainingPct; }
}
