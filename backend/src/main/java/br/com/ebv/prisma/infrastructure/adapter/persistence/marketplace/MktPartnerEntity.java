package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "tb_mkt_partner")
public class MktPartnerEntity {
    @Id @Column(name = "partner_id") private UUID partnerId;
    @Column(nullable = false, unique = true) private String code;
    @Column(nullable = false) private String name;
    @Column(name = "eligibility_json", nullable = false) private String eligibilityJson;
    @Column(nullable = false) private Boolean active;

    public UUID getPartnerId() { return partnerId; }
    public void setPartnerId(UUID partnerId) { this.partnerId = partnerId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEligibilityJson() { return eligibilityJson; }
    public void setEligibilityJson(String eligibilityJson) { this.eligibilityJson = eligibilityJson; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
