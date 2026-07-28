package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.scoring.exception.ModelNotFoundException;
import br.com.ebv.prisma.domain.scoring.port.in.RollbackModelUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RollbackModelService implements RollbackModelUseCase {

    private final ModelRegistryPort modelRegistry;

    public RollbackModelService(ModelRegistryPort modelRegistry) {
        this.modelRegistry = modelRegistry;
    }

    @Override
    @Transactional
    public Result execute(Command cmd) {
        var target = modelRegistry.find(cmd.modelId(), cmd.toVersion())
                .orElseThrow(() -> new ModelNotFoundException(cmd.modelId(), cmd.toVersion()));

        var currentProd = modelRegistry.findProduction(cmd.modelId());
        String previousVersion = currentProd.map(ModelRegistryPort.ModelVersion::version).orElse(null);

        if (currentProd.isPresent()) {
            modelRegistry.updateStage(cmd.modelId(), currentProd.get().version(), "RETIRED");
        }

        modelRegistry.updateStage(cmd.modelId(), cmd.toVersion(), "PRODUCTION");
        modelRegistry.savePromotion(
                cmd.modelId(), cmd.toVersion(), target.stage(), "PRODUCTION",
                cmd.approverIds() != null ? cmd.approverIds() : List.of()
        );

        return new Result(cmd.modelId(), cmd.toVersion(), previousVersion);
    }
}
