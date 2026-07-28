package br.com.ebv.prisma.infrastructure.adapter.persistence.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_golden_record")
public class GoldenRecordEntity {

    @Id
    @Column(name = "gr_id", nullable = false)
    private UUID grId;

    @Column(name = "canonical_documento", nullable = false, length = 14)
    private String canonicalDocumento;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getGrId() { return grId; }
    public void setGrId(UUID grId) { this.grId = grId; }
    public String getCanonicalDocumento() { return canonicalDocumento; }
    public void setCanonicalDocumento(String canonicalDocumento) { this.canonicalDocumento = canonicalDocumento; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
