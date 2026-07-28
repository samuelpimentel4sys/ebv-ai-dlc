package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.CalculateThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ThinfileServiceTest {

    @Mock ThinfileRepositoryPort repo;

    @Test
    @DisplayName("F02 calcula score thin-file quando history < 3")
    void calculateThin() {
        when(repo.findActiveModelCard()).thenReturn(Optional.of(new ThinfileRepositoryPort.ModelCard(
                "tf-lab-1.0", Instant.now(), Instant.now(), "lab", new BigDecimal("0.72"),
                new BigDecimal("0.55"), "{}", true
        )));
        var svc = new CalculateThinfileScoreService(repo);
        var r = svc.execute(new CalculateThinfileScoreUseCase.Command("12345678901", 1));
        assertThat(r.thinFileFlag()).isTrue();
        assertThat(r.scoreValue()).isEqualTo(520);
        verify(repo).saveScore(any());
    }
}
