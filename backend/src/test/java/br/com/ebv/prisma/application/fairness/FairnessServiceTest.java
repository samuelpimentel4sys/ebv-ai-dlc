package br.com.ebv.prisma.application.fairness;

import br.com.ebv.prisma.domain.fairness.port.in.AnalyzeFairnessUseCase;
import br.com.ebv.prisma.domain.fairness.port.out.FairlearnEnginePort;
import br.com.ebv.prisma.domain.fairness.port.out.FairnessRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FairnessServiceTest {

    @Mock FairnessRepositoryPort fairnessRepo;
    @Mock FairlearnEnginePort fairlearnEngine;

    AnalyzeFairnessService analyzeService;

    @BeforeEach
    void setUp() {
        when(fairlearnEngine.enabled()).thenReturn(false);
        analyzeService = new AnalyzeFairnessService(fairnessRepo, fairlearnEngine, new ObjectMapper());
    }

    @Test
    @DisplayName("analyze → DONE + metric + alert when disparity > limit")
    void analyzeCreatesAlert() {
        var r = analyzeService.execute(new AnalyzeFairnessUseCase.Command(
                "credit-xgb-4.8.2",
                new AnalyzeFairnessUseCase.Window(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30)),
                List.of("REGION_PROXY"),
                List.of("DEMOGRAPHIC_PARITY"),
                "COMMITTEE-2026-02"
        ));

        assertThat(r.status()).isEqualTo("DONE");
        assertThat(r.alertOpened()).isTrue();
        assertThat(r.modelVersion()).isEqualTo("credit-xgb-4.8.2");

        verify(fairnessRepo, atLeastOnce()).saveRun(any());
        verify(fairnessRepo).saveMetric(any());

        ArgumentCaptor<FairnessRepositoryPort.AlertRecord> alertCap =
                ArgumentCaptor.forClass(FairnessRepositoryPort.AlertRecord.class);
        verify(fairnessRepo).saveAlert(alertCap.capture());
        assertThat(alertCap.getValue().severity()).isEqualTo("HIGH");
        assertThat(alertCap.getValue().status()).isEqualTo("OPEN");
    }
}
