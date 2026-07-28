package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.scoring.port.in.ListModelsUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListModelsService implements ListModelsUseCase {

    private final ModelRegistryPort modelRegistry;

    public ListModelsService(ModelRegistryPort modelRegistry) {
        this.modelRegistry = modelRegistry;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ModelSummary> execute() {
        return modelRegistry.listAll().stream()
                .map(v -> new ModelSummary(
                        v.modelId(),
                        v.version(),
                        v.stage(),
                        v.artifactUri(),
                        v.metricsJson(),
                        v.immutable(),
                        v.createdAt()
                ))
                .toList();
    }
}
