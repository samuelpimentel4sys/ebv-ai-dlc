package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_consent_cache")
@IdClass(ConsentCacheEntity.Pk.class)
public class ConsentCacheEntity {

    @Id
    @Column(length = 14)
    private String documento;

    @Id
    @Column(length = 80)
    private String purpose;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public static class Pk implements Serializable {
        private String documento;
        private String purpose;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Pk pk)) return false;
            return Objects.equals(documento, pk.documento) && Objects.equals(purpose, pk.purpose);
        }

        @Override
        public int hashCode() {
            return Objects.hash(documento, purpose);
        }
    }
}
