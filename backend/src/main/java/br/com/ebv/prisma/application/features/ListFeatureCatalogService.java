package br.com.ebv.prisma.application.features;

import br.com.ebv.prisma.domain.features.port.in.ListFeatureCatalogUseCase;
import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListFeatureCatalogService implements ListFeatureCatalogUseCase {

    private final FeatureStorePort featureStore;

    public ListFeatureCatalogService(FeatureStorePort featureStore) {
        this.featureStore = featureStore;
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeatureStorePort.CatalogEntry> execute() {
        return featureStore.listActiveCatalog();
    }
}
