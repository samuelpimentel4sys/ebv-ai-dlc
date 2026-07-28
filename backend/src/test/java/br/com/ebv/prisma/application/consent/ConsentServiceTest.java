package br.com.ebv.prisma.application.consent;

import br.com.ebv.prisma.domain.consent.port.in.RegisterConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.in.RevokeConsentUseCase;
import br.com.ebv.prisma.domain.consent.port.out.ConsentRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsentServiceTest {

    @Mock ConsentRepositoryPort repo;
    RegisterConsentService register;
    RevokeConsentService revoke;

    @BeforeEach
    void setUp() {
        register = new RegisterConsentService(repo);
        revoke = new RevokeConsentService(repo);
    }

    @Test
    @DisplayName("F04 registra consentimento ACTIVE e revoga")
    void registerAndRevoke() {
        var result = register.execute(new RegisterConsentUseCase.Command(
                "12345678901",
                List.of(new RegisterConsentUseCase.Item("UTILITIES_SCORE", "CEMIG-MG", true, Instant.parse("2027-07-27T00:00:00Z"))),
                "MOBILE_APP", "v3.2"
        ));
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).status()).isEqualTo("ACTIVE");

        ArgumentCaptor<ConsentRepositoryPort.ConsentRecord> cap =
                ArgumentCaptor.forClass(ConsentRepositoryPort.ConsentRecord.class);
        verify(repo).save(cap.capture());
        UUID id = cap.getValue().consentId();
        when(repo.findById(id)).thenReturn(Optional.of(cap.getValue()));

        var revoked = revoke.execute(new RevokeConsentUseCase.Command(id));
        assertThat(revoked.status()).isEqualTo("REVOKED");
    }
}
