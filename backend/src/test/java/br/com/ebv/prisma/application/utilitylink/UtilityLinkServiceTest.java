package br.com.ebv.prisma.application.utilitylink;

import br.com.ebv.prisma.domain.utilitylink.port.in.LinkUtilityUseCase;
import br.com.ebv.prisma.domain.utilitylink.port.out.UtilityLinkRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UtilityLinkServiceTest {

    @Mock UtilityLinkRepositoryPort repo;

    @Test
    @DisplayName("F08 link confirma titularidade stub")
    void linkOk() {
        var svc = new LinkUtilityService(repo);
        var r = svc.execute(new LinkUtilityUseCase.Command(
                "12345678901", "CEMIG-MG", "UC-998877", "ENERGIA", "Marina Souza"));
        assertThat(r.status()).isEqualTo("CONFIRMED");
        assertThat(r.sourceConfirmed()).isTrue();
        verify(repo).save(any());
    }
}
