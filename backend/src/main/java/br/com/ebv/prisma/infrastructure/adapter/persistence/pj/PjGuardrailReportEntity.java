package br.com.ebv.prisma.infrastructure.adapter.persistence.pj;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tb_pj_guardrail_report")
public class PjGuardrailReportEntity {

    @Id
    private UUID id;

    @Column(name = "opinion_id", nullable = false)
    private UUID opinionId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, length = 80)
    private String model;

    @Column(name = "created_at")
    private Instant createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getOpinionId() { return opinionId; }
    public void setOpinionId(UUID opinionId) { this.opinionId = opinionId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
