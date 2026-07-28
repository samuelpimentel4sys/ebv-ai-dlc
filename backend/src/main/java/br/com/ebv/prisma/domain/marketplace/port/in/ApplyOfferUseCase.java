package br.com.ebv.prisma.domain.marketplace.port.in;

import java.util.UUID;

public interface ApplyOfferUseCase {
    record Command(UUID offerId, String documento, UUID consentId) {}
    record Result(UUID referralId, String status, String partnerRef) {}
    Result execute(Command command);
}
