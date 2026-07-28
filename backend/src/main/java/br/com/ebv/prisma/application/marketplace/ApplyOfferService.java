package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceNotFoundException;
import br.com.ebv.prisma.domain.marketplace.exception.MarketplaceValidationException;
import br.com.ebv.prisma.domain.marketplace.port.in.ApplyOfferUseCase;
import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class ApplyOfferService implements ApplyOfferUseCase {

    private final MarketplaceRepositoryPort repo;

    public ApplyOfferService(MarketplaceRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.consentId() == null) {
            throw new MarketplaceValidationException("documento e consentId obrigatórios");
        }
        var offer = repo.findOffer(command.offerId())
                .orElseThrow(() -> new MarketplaceNotFoundException("oferta não encontrada"));
        UUID referralId = UUID.randomUUID();
        String partnerRef = "LAB-" + referralId.toString().substring(0, 8);
        repo.saveReferral(new MarketplaceRepositoryPort.ReferralRecord(
                referralId, offer.offerId(), sha256(command.documento().trim()),
                command.consentId(), "SENT", partnerRef, Instant.now()
        ));
        return new Result(referralId, "SENT", partnerRef);
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
