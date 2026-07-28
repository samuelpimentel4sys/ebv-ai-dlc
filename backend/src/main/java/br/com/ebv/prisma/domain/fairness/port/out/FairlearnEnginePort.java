package br.com.ebv.prisma.domain.fairness.port.out;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Motor Fairlearn (sidecar HTTP lab).
 */
public interface FairlearnEnginePort {

    boolean enabled();

    /**
     * Roda analyze no sidecar. Empty → use stub local.
     */
    Optional<AnalyzeResult> analyze(AnalyzeCommand command);

    record AnalyzeCommand(
            List<Integer> yTrue,
            List<Integer> yPred,
            List<String> sensitiveFeature,
            String featureName
    ) {}

    record AnalyzeResult(
            String runId,
            String status,
            BigDecimal demographicParityDifference,
            BigDecimal equalizedOddsDifference
    ) {}
}
