package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.scoring.exception.MetricsGateException;
import br.com.ebv.prisma.domain.scoring.exception.ModelImmutableException;
import br.com.ebv.prisma.domain.scoring.exception.ModelNotFoundException;
import br.com.ebv.prisma.domain.scoring.port.in.PromoteModelUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class PromoteModelService implements PromoteModelUseCase {

    private static final List<String> STAGE_ORDER = List.of("SHADOW", "CANARY", "PRODUCTION");

    private final ModelRegistryPort modelRegistry;

    public PromoteModelService(ModelRegistryPort modelRegistry) {
        this.modelRegistry = modelRegistry;
    }

    @Override
    @Transactional
    public Result execute(Command cmd) {
        var modelVersion = modelRegistry.find(cmd.modelId(), cmd.version())
                .orElseThrow(() -> new ModelNotFoundException(cmd.modelId(), cmd.version()));

        String fromStage = modelVersion.stage();
        String toStage = cmd.toStage();

        if (fromStage.equals(toStage)) {
            throw new ModelImmutableException(cmd.modelId(), cmd.version());
        }

        boolean skipping = isSkippingStages(fromStage, toStage);
        if (skipping && (cmd.approverIds() == null || cmd.approverIds().size() < 2)) {
            throw new IllegalArgumentException(
                    "Promoção emergencial (pula estágios) exige >= 2 approvers");
        }

        if ("CANARY".equals(fromStage) && "PRODUCTION".equals(toStage) && !cmd.canaryMetricsOk()) {
            throw new MetricsGateException(cmd.modelId(), cmd.version());
        }

        modelRegistry.updateStage(cmd.modelId(), cmd.version(), toStage);
        modelRegistry.savePromotion(
                cmd.modelId(), cmd.version(), fromStage, toStage,
                cmd.approverIds() != null ? cmd.approverIds() : List.of()
        );

        return new Result(cmd.modelId(), cmd.version(), fromStage, toStage, Instant.now());
    }

    private boolean isSkippingStages(String from, String to) {
        int fromIdx = STAGE_ORDER.indexOf(from);
        int toIdx = STAGE_ORDER.indexOf(to);
        if (fromIdx < 0 || toIdx < 0) return false;
        return toIdx - fromIdx > 1;
    }
}
