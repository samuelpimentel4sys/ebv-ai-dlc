package br.com.ebv.prisma.domain.features.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FeatureStorePort {

    record CatalogEntry(String name, String entity, String valueType, int maxAgeSeconds, String owner, boolean active) {}

    record FeatureValue(String name, BigDecimal numericValue, String rawJson, Instant eventTs) {}

    List<CatalogEntry> listActiveCatalog();

    Optional<CatalogEntry> findCatalog(String name);

    Optional<FeatureValue> findAsOf(String documento, String featureName, Instant asOf);

    void upsert(String documento, String featureName, String valueJson, Instant eventTs);

    long countActiveGoldenRecords(String documento);
}
