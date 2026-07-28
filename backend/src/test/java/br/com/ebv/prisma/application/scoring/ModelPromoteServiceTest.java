package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.scoring.exception.MetricsGateException;
import br.com.ebv.prisma.domain.scoring.exception.ModelImmutableException;
import br.com.ebv.prisma.domain.scoring.exception.ModelNotFoundException;
import br.com.ebv.prisma.domain.scoring.port.in.PromoteModelUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModelPromoteServiceTest {

    @Mock
    ModelRegistryPort modelRegistry;

    @Test
    @DisplayName("CT-03 promote canary→prod sem canaryMetricsOk → MetricsGateException 422")
    void promoteCanaryWithoutMetrics() {
        when(modelRegistry.find("score-vivo", "3.2.1")).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "3.2.1", "CANARY",
                        "s3://bucket/3.2.1/model.onnx", "{\"auc\":0.84}", true, Instant.now())
        ));

        var service = new PromoteModelService(modelRegistry);
        assertThatThrownBy(() -> service.execute(new PromoteModelUseCase.Command(
                "score-vivo", "3.2.1", "PRODUCTION", false, List.of("user1"), false
        ))).isInstanceOf(MetricsGateException.class)
                .hasMessageContaining("score-vivo");

        verify(modelRegistry, never()).updateStage(any(), any(), any());
    }

    @Test
    @DisplayName("CT-03b promote canary→prod com canaryMetricsOk=true → sucesso")
    void promoteCanarySuccess() {
        when(modelRegistry.find("score-vivo", "3.2.1")).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "3.2.1", "CANARY",
                        "s3://bucket/3.2.1/model.onnx", "{\"auc\":0.84,\"canaryOk\":true}", true, Instant.now())
        ));

        var service = new PromoteModelService(modelRegistry);
        var result = service.execute(new PromoteModelUseCase.Command(
                "score-vivo", "3.2.1", "PRODUCTION", true, List.of("approver1"), false
        ));

        assertThat(result.fromStage()).isEqualTo("CANARY");
        assertThat(result.toStage()).isEqualTo("PRODUCTION");
        verify(modelRegistry).updateStage(eq("score-vivo"), eq("3.2.1"), eq("PRODUCTION"));
        verify(modelRegistry).savePromotion(eq("score-vivo"), eq("3.2.1"), eq("CANARY"), eq("PRODUCTION"), any());
    }

    @Test
    @DisplayName("Emergency skip SHADOW→PRODUCTION sem 2 approvers → 400")
    void emergencySkipNeedsApprovers() {
        when(modelRegistry.find("score-vivo", "4.0.0")).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "4.0.0", "SHADOW",
                        "s3://bucket/4.0.0/model.onnx", null, true, Instant.now())
        ));

        var service = new PromoteModelService(modelRegistry);
        assertThatThrownBy(() -> service.execute(new PromoteModelUseCase.Command(
                "score-vivo", "4.0.0", "PRODUCTION", true, List.of("only-one"), true
        ))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("2 approvers");
    }

    @Test
    @DisplayName("Emergency skip com 2 approvers → sucesso")
    void emergencySkipWithApprovers() {
        when(modelRegistry.find("score-vivo", "4.0.0")).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "4.0.0", "SHADOW",
                        "s3://bucket/4.0.0/model.onnx", null, true, Instant.now())
        ));

        var service = new PromoteModelService(modelRegistry);
        var result = service.execute(new PromoteModelUseCase.Command(
                "score-vivo", "4.0.0", "PRODUCTION", true, List.of("approver1", "approver2"), true
        ));

        assertThat(result.fromStage()).isEqualTo("SHADOW");
        assertThat(result.toStage()).isEqualTo("PRODUCTION");
    }

    @Test
    @DisplayName("Overwrite mesmo stage → ModelImmutableException 409")
    void overwriteSameStage() {
        when(modelRegistry.find("score-vivo", "3.2.1")).thenReturn(Optional.of(
                new ModelRegistryPort.ModelVersion("score-vivo", "3.2.1", "CANARY",
                        "s3://bucket/3.2.1/model.onnx", null, true, Instant.now())
        ));

        var service = new PromoteModelService(modelRegistry);
        assertThatThrownBy(() -> service.execute(new PromoteModelUseCase.Command(
                "score-vivo", "3.2.1", "CANARY", true, List.of("approver1"), false
        ))).isInstanceOf(ModelImmutableException.class);
    }

    @Test
    @DisplayName("Model inexistente → ModelNotFoundException 404")
    void modelNotFound() {
        when(modelRegistry.find("score-vivo", "9.9.9")).thenReturn(Optional.empty());

        var service = new PromoteModelService(modelRegistry);
        assertThatThrownBy(() -> service.execute(new PromoteModelUseCase.Command(
                "score-vivo", "9.9.9", "PRODUCTION", true, List.of("approver1"), false
        ))).isInstanceOf(ModelNotFoundException.class);
    }
}
