package br.com.ebv.prisma.domain.features.port.in;

import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;

import java.util.List;

public interface ListFeatureCatalogUseCase {
    List<FeatureStorePort.CatalogEntry> execute();
}
