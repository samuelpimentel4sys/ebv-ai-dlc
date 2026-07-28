package br.com.ebv.prisma.infrastructure.adapter.persistence.sla;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_sla_escalation")
public class SlaEscalationEntity {

    @Id
    private UUID id;

    @Column(name = "dispute_id", nullable = false)
    private UUID disputeId;

    @Column(nullable = false)
    private int level;

    @Column(name = "notified_at", nullable = false)
    private OffsetDateTime notifiedAt;

    @Column(nullable = false, length = 255)
    private String reason;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getDisputeId() { return disputeId; }
    public void setDisputeId(UUID disputeId) { this.disputeId = disputeId; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public OffsetDateTime getNotifiedAt() { return notifiedAt; }
    public void setNotifiedAt(OffsetDateTime notifiedAt) { this.notifiedAt = notifiedAt; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
