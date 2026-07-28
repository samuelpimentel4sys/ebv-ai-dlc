package br.com.ebv.prisma.domain.marketplace.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketplaceRepositoryPort {
    record OfferRecord(UUID offerId, UUID partnerId, String partnerCode, String title, String productType,
                       String explanationTemplate, boolean active) {}
    record ReferralRecord(UUID referralId, UUID offerId, String documentoHash, UUID consentId,
                          String status, String partnerRef, Instant createdAt) {}

    List<OfferRecord> findActiveOffers();
    Optional<OfferRecord> findOffer(UUID offerId);
    void saveReferral(ReferralRecord record);
}
