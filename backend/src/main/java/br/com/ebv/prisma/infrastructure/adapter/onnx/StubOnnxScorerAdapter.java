package br.com.ebv.prisma.infrastructure.adapter.onnx;

import br.com.ebv.prisma.domain.scoring.port.out.OnnxScorerPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "prisma.onnx.mode", havingValue = "stub", matchIfMissing = true)
public class StubOnnxScorerAdapter implements OnnxScorerPort {

    @Override
    public Optional<BigDecimal> score(List<Double> features) {
        return Optional.empty();
    }

    @Override
    public boolean live() {
        return false;
    }
}
