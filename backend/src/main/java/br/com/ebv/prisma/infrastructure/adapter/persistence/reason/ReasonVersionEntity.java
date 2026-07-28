package br.com.ebv.prisma.infrastructure.adapter.persistence.reason;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_reason_version")
public class ReasonVersionEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 60)
    private String code;

    @Column(nullable = false)
    private int version;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "consumer_text", nullable = false, columnDefinition = "TEXT")
    private String consumerText;

    @Column(name = "analyst_text", nullable = false, columnDefinition = "TEXT")
    private String analystText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String channels;

    @Column(name = "mappings_json", columnDefinition = "TEXT")
    private String mappingsJson;

    @Column(name = "legal_approval", length = 120)
    private String legalApproval;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getConsumerText() { return consumerText; }
    public void setConsumerText(String consumerText) { this.consumerText = consumerText; }
    public String getAnalystText() { return analystText; }
    public void setAnalystText(String analystText) { this.analystText = analystText; }
    public String getChannels() { return channels; }
    public void setChannels(String channels) { this.channels = channels; }
    public String getMappingsJson() { return mappingsJson; }
    public void setMappingsJson(String mappingsJson) { this.mappingsJson = mappingsJson; }
    public String getLegalApproval() { return legalApproval; }
    public void setLegalApproval(String legalApproval) { this.legalApproval = legalApproval; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
