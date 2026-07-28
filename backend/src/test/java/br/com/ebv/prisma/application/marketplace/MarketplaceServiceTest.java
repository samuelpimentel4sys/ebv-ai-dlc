package br.com.ebv.prisma.application.marketplace;

import br.com.ebv.prisma.domain.marketplace.port.in.ApplyOfferUseCase;
import br.com.ebv.prisma.domain.marketplace.port.out.MarketplaceRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketplaceServiceTest {

    @Mock MarketplaceRepositoryPort repo;

    @Test
    @DisplayName("F07 apply cria referral SENT")
    void applyOk() {
        UUID offerId = UUID.fromString("f0000000-0000-4000-8000-000000000002");
        when(repo.findOffer(offerId)).thenReturn(Optional.of(new MarketplaceRepositoryPort.OfferRecord(
                offerId, UUID.randomUUID(), "BANK-LAB", "Conta Inclusão", "CHECKING", "tpl", true)));
        var svc = new ApplyOfferService(repo);
        var r = svc.execute(new ApplyOfferUseCase.Command(offerId, "12345678901", UUID.randomUUID()));
        assertThat(r.status()).isEqualTo("SENT");
        verify(repo).saveReferral(any());
    }
}
