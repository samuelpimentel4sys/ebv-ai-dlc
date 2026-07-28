package br.com.ebv.prisma.domain.scoring.port.out;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Inferência ONNX (sidecar HTTP ou futuro in-process).
 */
public interface OnnxScorerPort {

    /**
     * @return empty se backend desligado / modelo não carregado / erro → caller usa fórmula lab
     */
    Optional<BigDecimal> score(List<Double> features);

    boolean live();
}
