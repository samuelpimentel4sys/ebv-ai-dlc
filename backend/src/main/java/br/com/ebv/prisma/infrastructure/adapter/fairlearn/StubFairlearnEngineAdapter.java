package br.com.ebv.prisma.infrastructure.adapter.fairlearn;

import br.com.ebv.prisma.domain.fairness.port.out.FairlearnEnginePort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@ConditionalOnProperty(name = "prisma.fairlearn.enabled", havingValue = "false", matchIfMissing = true)
public class StubFairlearnEngineAdapter implements FairlearnEnginePort {

    @Override
    public boolean enabled() {
        return false;
    }

    @Override
    public Optional<AnalyzeResult> analyze(AnalyzeCommand command) {
        return Optional.empty();
    }
}
