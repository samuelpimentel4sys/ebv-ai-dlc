package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tb_identity_link")
public class IdentityLinkEntity {

    @Id
    private UUID id;

    @Column(name = "gr_id", nullable = false)
    private UUID grId;

    @Column(name = "source_system", nullable = false, length = 40)
    private String sourceSystem;

    @Column(name = "source_key", nullable = false, length = 120)
    private String sourceKey;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal confidence;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getGrId() { return grId; }
    public void setGrId(UUID grId) { this.grId = grId; }
    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }
    public String getSourceKey() { return sourceKey; }
    public void setSourceKey(String sourceKey) { this.sourceKey = sourceKey; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
}
