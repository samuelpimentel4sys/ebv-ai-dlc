package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "tb_mkt_offer")
public class MktOfferEntity {
    @Id @Column(name = "offer_id") private UUID offerId;
    @Column(name = "partner_id", nullable = false) private UUID partnerId;
    @Column(nullable = false) private String title;
    @Column(name = "product_type", nullable = false) private String productType;
    @Column(name = "explanation_template", nullable = false) private String explanationTemplate;
    @Column(nullable = false) private Boolean active;

    public UUID getOfferId() { return offerId; }
    public void setOfferId(UUID offerId) { this.offerId = offerId; }
    public UUID getPartnerId() { return partnerId; }
    public void setPartnerId(UUID partnerId) { this.partnerId = partnerId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public String getExplanationTemplate() { return explanationTemplate; }
    public void setExplanationTemplate(String explanationTemplate) { this.explanationTemplate = explanationTemplate; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
