package br.com.ebv.prisma.infrastructure.adapter.persistence.utilitylink;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_utility_link")
public class UtilityLinkEntity {
    @Id @Column(name = "link_id") private UUID linkId;
    @Column(name = "documento_hash", nullable = false, length = 64) private String documentoHash;
    @Column(name = "partner_code", nullable = false, length = 40) private String partnerCode;
    @Column(name = "account_ref", nullable = false, length = 80) private String accountRef;
    @Column(name = "utility_type", nullable = false, length = 20) private String utilityType;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "linked_at", nullable = false) private OffsetDateTime linkedAt;
    @Column(name = "unlinked_at") private OffsetDateTime unlinkedAt;

    public UUID getLinkId() { return linkId; }
    public void setLinkId(UUID linkId) { this.linkId = linkId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public String getAccountRef() { return accountRef; }
    public void setAccountRef(String accountRef) { this.accountRef = accountRef; }
    public String getUtilityType() { return utilityType; }
    public void setUtilityType(String utilityType) { this.utilityType = utilityType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getLinkedAt() { return linkedAt; }
    public void setLinkedAt(OffsetDateTime linkedAt) { this.linkedAt = linkedAt; }
    public OffsetDateTime getUnlinkedAt() { return unlinkedAt; }
    public void setUnlinkedAt(OffsetDateTime unlinkedAt) { this.unlinkedAt = unlinkedAt; }
}
