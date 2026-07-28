package br.com.ebv.prisma.infrastructure.adapter.persistence.marketplace;

import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class MarketplaceRepositoryAdapter implements MarketplaceRepositoryPort {

    private final MktOfferJpaRepository offerJpa;
    private final MktPartnerJpaRepository partnerJpa;
    private final MktReferralJpaRepository referralJpa;

    public MarketplaceRepositoryAdapter(
            MktOfferJpaRepository offerJpa,
            MktPartnerJpaRepository partnerJpa,
            MktReferralJpaRepository referralJpa
    ) {
        this.offerJpa = offerJpa;
        this.partnerJpa = partnerJpa;
        this.referralJpa = referralJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfferRecord> findActiveOffers() {
        return offerJpa.findByActiveTrue().stream().map(this::toOffer).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OfferRecord> findOffer(UUID offerId) {
        return offerJpa.findById(offerId).map(this::toOffer);
    }

    @Override
    public void saveReferral(ReferralRecord record) {
        MktReferralEntity e = new MktReferralEntity();
        e.setReferralId(record.referralId());
        e.setOfferId(record.offerId());
        e.setDocumentoHash(record.documentoHash());
        e.setConsentId(record.consentId());
        e.setStatus(record.status());
        e.setPartnerRef(record.partnerRef());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        referralJpa.save(e);
    }

    private OfferRecord toOffer(MktOfferEntity e) {
        String partnerCode = partnerJpa.findById(e.getPartnerId()).map(MktPartnerEntity::getCode).orElse("UNKNOWN");
        return new OfferRecord(e.getOfferId(), e.getPartnerId(), partnerCode, e.getTitle(),
                e.getProductType(), e.getExplanationTemplate(), Boolean.TRUE.equals(e.getActive()));
    }
}
