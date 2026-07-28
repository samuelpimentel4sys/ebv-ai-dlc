package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;
import br.com.ebv.prisma.domain.scoring.exception.ModelUnavailableException;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import br.com.ebv.prisma.domain.scoring.port.out.OnnxScorerPort;
import br.com.ebv.prisma.domain.scoring.port.out.ScoreRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoreRecalcServiceTest {

    @Mock ModelRegistryPort modelRegistry;
    @Mock ScoreRepositoryPort scoreRepo;
    @Mock FeatureStorePort featureStore;
    @Mock OnnxScorerPort onnxScorer;

    @BeforeEach
    void onnxOff() {
        lenient().when(onnxScorer.live()).thenReturn(false);
    }

    @Test
    @DisplayName("CT-07 recalc sem PRODUCTION model → ModelUnavailableException 503")
    void noProductionModel() {
        when(modelRegistry.findProduction(RecalculateScoreService.SCORING_MODEL_ID))
                .thenReturn(Optional.empty());

        var service = new RecalculateScoreService(modelRegistry, scoreRepo, featureStore, onnxScorer);
        assertThatThrownBy(() -> service.execute(new RecalculateScoreUseCase.Command(
                "12345678901", "MANUAL", false
        ))).isInstanceOf(ModelUnavailableException.class)
                .hasMessageContaining("score-vivo");

        verify(scoreRepo, never()).saveCurrent(any(), any(), any());
    }

    @Test
    @DisplayName("CT-07b recalc sem features → baseline 700")
    void baselineScoreNoFeatures() {
        when(modelRegistry.findProduction(RecalculateScoreService.SCORING_MODEL_ID)).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "3.1.0", "PRODUCTION",
                        "s3://...", null, true, Instant.now())
        ));
        when(featureStore.findAsOf(eq("12345678901"), eq("divida_aberta"), any())).thenReturn(Optional.empty());
        when(featureStore.findAsOf(eq("12345678901"), eq("qtd_negativacoes_12m"), any())).thenReturn(Optional.empty());

        var service = new RecalculateScoreService(modelRegistry, scoreRepo, featureStore, onnxScorer);
        var result = service.execute(new RecalculateScoreUseCase.Command("12345678901", "TEST", false));

        assertThat(result.score()).isEqualByComparingTo(new BigDecimal("700.00"));
        assertThat(result.modelVersion()).isEqualTo("3.1.0");
        assertThat(result.coalesced()).isFalse();
        verify(scoreRepo).saveCurrent(eq("12345678901"), eq(new BigDecimal("700.00")), eq("3.1.0"));
    }

    @Test
    @DisplayName("CT-07c recalc com features — score deduzido das negativações")
    void scoreWithNegFeature() {
        when(modelRegistry.findProduction(RecalculateScoreService.SCORING_MODEL_ID)).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "3.1.0", "PRODUCTION",
                        "s3://...", null, true, Instant.now())
        ));
        when(featureStore.findAsOf(eq("12345678901"), eq("divida_aberta"), any())).thenReturn(Optional.empty());
        when(featureStore.findAsOf(eq("12345678901"), eq("qtd_negativacoes_12m"), any())).thenReturn(Optional.of(
                new FeatureStorePort.FeatureValue("qtd_negativacoes_12m", null, "4", Instant.now().minusSeconds(30))
        ));

        var service = new RecalculateScoreService(modelRegistry, scoreRepo, featureStore, onnxScorer);
        var result = service.execute(new RecalculateScoreUseCase.Command("12345678901", "TEST", false));

        assertThat(result.score()).isEqualByComparingTo(new BigDecimal("640.00"));
        assertThat(result.coalesced()).isFalse();
    }

    @Test
    @DisplayName("CT-07d coalescência 5s — segunda chamada não-critical retorna coalesced=true")
    void coalescenceWindow() {
        when(modelRegistry.findProduction(RecalculateScoreService.SCORING_MODEL_ID)).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "3.1.0", "PRODUCTION",
                        "s3://...", null, true, Instant.now())
        ));
        when(featureStore.findAsOf(any(), any(), any())).thenReturn(Optional.empty());
        when(scoreRepo.findCurrent("12345678901")).thenReturn(Optional.of(
                new ScoreRepositoryPort.CurrentScore("12345678901", new BigDecimal("700.00"), "3.1.0", Instant.now())
        ));

        var service = new RecalculateScoreService(modelRegistry, scoreRepo, featureStore, onnxScorer);
        service.execute(new RecalculateScoreUseCase.Command("12345678901", "FIRST", false));
        var result = service.execute(new RecalculateScoreUseCase.Command("12345678901", "SECOND", false));

        assertThat(result.coalesced()).isTrue();
    }
}
