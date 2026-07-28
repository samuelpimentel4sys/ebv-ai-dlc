package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_mkt_referral")
public class MktReferralEntity {
    @Id @Column(name = "referral_id") private UUID referralId;
    @Column(name = "offer_id", nullable = false) private UUID offerId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "consent_id", nullable = false) private UUID consentId;
    @Column(nullable = false) private String status;
    @Column(name = "partner_ref") private String partnerRef;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getReferralId() { return referralId; }
    public void setReferralId(UUID referralId) { this.referralId = referralId; }
    public UUID getOfferId() { return offerId; }
    public void setOfferId(UUID offerId) { this.offerId = offerId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public UUID getConsentId() { return consentId; }
    public void setConsentId(UUID consentId) { this.consentId = consentId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPartnerRef() { return partnerRef; }
    public void setPartnerRef(String partnerRef) { this.partnerRef = partnerRef; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
