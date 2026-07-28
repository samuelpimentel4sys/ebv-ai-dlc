package br.com.ebv.prisma.infrastructure.adapter.persistence.consent;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_consent")
public class ConsentEntity {
    @Id
    @Column(name = "consent_id")
    private UUID consentId;
    @Column(name = "documento_hash", nullable = false, length = 64)
    private String documentoHash;
    @Column(name = "purpose_code", nullable = false, length = 40)
    private String purposeCode;
    @Column(name = "source_code", nullable = false, length = 40)
    private String sourceCode;
    @Column(nullable = false, length = 20)
    private String status;
    @Column(name = "granted_at", nullable = false)
    private OffsetDateTime grantedAt;
    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;
    @Column(name = "valid_to")
    private OffsetDateTime validTo;
    @Column(nullable = false, length = 30)
    private String channel;
    @Column(name = "version_termo", nullable = false, length = 20)
    private String versionTermo;

    public UUID getConsentId() { return consentId; }
    public void setConsentId(UUID consentId) { this.consentId = consentId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getPurposeCode() { return purposeCode; }
    public void setPurposeCode(String purposeCode) { this.purposeCode = purposeCode; }
    public String getSourceCode() { return sourceCode; }
    public void setSourceCode(String sourceCode) { this.sourceCode = sourceCode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(OffsetDateTime grantedAt) { this.grantedAt = grantedAt; }
    public OffsetDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(OffsetDateTime revokedAt) { this.revokedAt = revokedAt; }
    public OffsetDateTime getValidTo() { return validTo; }
    public void setValidTo(OffsetDateTime validTo) { this.validTo = validTo; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getVersionTermo() { return versionTermo; }
    public void setVersionTermo(String versionTermo) { this.versionTermo = versionTermo; }
}
