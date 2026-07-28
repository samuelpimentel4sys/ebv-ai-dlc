package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tb_pj_opinion")
public class PjOpinionEntity {

    @Id
    private UUID id;

    @Column(nullable = false, columnDefinition = "bpchar(14)")
    private String cnpj;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "operation_amount", precision = 18, scale = 2)
    private BigDecimal operationAmount;

    @Column(length = 3)
    private String currency;

    @Column(name = "started_at")
    private Instant startedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public BigDecimal getOperationAmount() { return operationAmount; }
    public void setOperationAmount(BigDecimal operationAmount) { this.operationAmount = operationAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
}
