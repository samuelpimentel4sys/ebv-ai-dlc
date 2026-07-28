package br.com.ebv.prisma.infrastructure.adapter.persistence.decision;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_decision")
public class DecisionEntity {

    @Id
    @Column(name = "decision_id")
    private UUID decisionId;

    @Column(nullable = false, length = 14)
    private String documento;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal score;

    @Column(name = "model_version", nullable = false, length = 40)
    private String modelVersion;

    @Column(length = 40)
    private String outcome;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "prev_sha256", length = 64)
    private String prevSha256;

    @Column(name = "storage_uri", nullable = false, columnDefinition = "TEXT")
    private String storageUri;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "latency_ms")
    private Integer latencyMs;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "degraded_flags", columnDefinition = "text[]")
    private String[] degradedFlags;

    @Column(name = "client_id", length = 64)
    private String clientId;

    @Column(nullable = false)
    private boolean partial;

    @Column(name = "product_code", length = 40)
    private String productCode;

    @Column(name = "explanation_ref", columnDefinition = "TEXT")
    private String explanationRef;

    @Column(name = "locked_until")
    private LocalDate lockedUntil;

    public UUID getDecisionId() { return decisionId; }
    public void setDecisionId(UUID decisionId) { this.decisionId = decisionId; }
    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }
    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public String getSha256() { return sha256; }
    public void setSha256(String sha256) { this.sha256 = sha256; }
    public String getPrevSha256() { return prevSha256; }
    public void setPrevSha256(String prevSha256) { this.prevSha256 = prevSha256; }
    public String getStorageUri() { return storageUri; }
    public void setStorageUri(String storageUri) { this.storageUri = storageUri; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getLatencyMs() { return latencyMs; }
    public void setLatencyMs(Integer latencyMs) { this.latencyMs = latencyMs; }
    public String[] getDegradedFlags() { return degradedFlags; }
    public void setDegradedFlags(String[] degradedFlags) { this.degradedFlags = degradedFlags; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public boolean isPartial() { return partial; }
    public void setPartial(boolean partial) { this.partial = partial; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public String getExplanationRef() { return explanationRef; }
    public void setExplanationRef(String explanationRef) { this.explanationRef = explanationRef; }
    public LocalDate getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDate lockedUntil) { this.lockedUntil = lockedUntil; }
}
