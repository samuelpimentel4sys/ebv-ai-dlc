package br.com.ebv.prisma.infrastructure.adapter.persistence.ingest;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "tb_ingest_source")
public class IngestSourceEntity {

    @Id
    @Column(length = 40)
    private String code;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "last_success_at")
    private OffsetDateTime lastSuccessAt;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getLastSuccessAt() { return lastSuccessAt; }
    public void setLastSuccessAt(OffsetDateTime lastSuccessAt) { this.lastSuccessAt = lastSuccessAt; }
}
