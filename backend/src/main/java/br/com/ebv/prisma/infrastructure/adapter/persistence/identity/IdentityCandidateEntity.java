package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_identity_candidate")
public class IdentityCandidateEntity {

    @Id
    private UUID id;

    @Column(name = "left_gr", nullable = false)
    private UUID leftGr;

    @Column(name = "right_gr", nullable = false)
    private UUID rightGr;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getLeftGr() { return leftGr; }
    public void setLeftGr(UUID leftGr) { this.leftGr = leftGr; }
    public UUID getRightGr() { return rightGr; }
    public void setRightGr(UUID rightGr) { this.rightGr = rightGr; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
