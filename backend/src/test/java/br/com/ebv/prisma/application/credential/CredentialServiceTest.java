package br.com.ebv.prisma.application.credential;

import br.com.ebv.prisma.domain.credential.port.in.CreateCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.in.RevokeCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.in.RotateCredentialUseCase;
import br.com.ebv.prisma.domain.credential.port.out.CredentialRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class CredentialServiceTest {

    @Mock CredentialRepositoryPort credentialRepo;
    CreateCredentialService create;
    RotateCredentialService rotate;
    RevokeCredentialService revoke;

    @BeforeEach
    void setUp() {
        ObjectMapper om = new ObjectMapper();
        create = new CreateCredentialService(credentialRepo, om);
        rotate = new RotateCredentialService(credentialRepo, om);
        revoke = new RevokeCredentialService(credentialRepo);
    }

    @Test
    @DisplayName("F07 create → rotate → revoke; secret plaintext só em create/rotate")
    void lifecycle() {
        var created = create.execute(new CreateCredentialUseCase.Command(
                "demo-tenant", List.of("credit.score.read"), "SANDBOX", 1000
        ));
        assertThat(created.secret()).startsWith("ebv_test_");
        assertThat(created.env()).isEqualTo("SANDBOX");

        ArgumentCaptor<CredentialRepositoryPort.CredentialRecord> cap =
                ArgumentCaptor.forClass(CredentialRepositoryPort.CredentialRecord.class);
        verify(credentialRepo).save(cap.capture());
        var stored = cap.getValue();
        assertThat(stored.secretHash()).isEqualTo(CreateCredentialService.sha256(created.secret()));
        assertThat(stored.secretHash()).doesNotContain(created.secret());

        when(credentialRepo.findById(stored.id())).thenReturn(Optional.of(stored));
        var rotated = rotate.execute(new RotateCredentialUseCase.Command(
                stored.id(), false, 24, "SCHEDULED_ROTATION"
        ));
        assertThat(rotated.secret()).isNotEqualTo(created.secret());
        assertThat(rotated.secret()).startsWith("ebv_test_");

        CredentialRepositoryPort.CredentialRecord afterRotate = new CredentialRepositoryPort.CredentialRecord(
                stored.id(), stored.clientId(), CreateCredentialService.sha256(rotated.secret()),
                stored.scopesJson(), stored.env(), "ACTIVE", stored.rateLimit(),
                stored.tenantId(), stored.createdAt(), Instant.now()
        );
        when(credentialRepo.findById(stored.id())).thenReturn(Optional.of(afterRotate));
        revoke.execute(new RevokeCredentialUseCase.Command(stored.id()));

        ArgumentCaptor<CredentialRepositoryPort.CredentialRecord> revokeCap =
                ArgumentCaptor.forClass(CredentialRepositoryPort.CredentialRecord.class);
        verify(credentialRepo, org.mockito.Mockito.atLeast(3)).save(revokeCap.capture());
        assertThat(revokeCap.getValue().status()).isEqualTo("REVOKED");
    }
}
