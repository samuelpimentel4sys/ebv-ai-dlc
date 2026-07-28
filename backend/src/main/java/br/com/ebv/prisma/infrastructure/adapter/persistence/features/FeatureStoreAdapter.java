package br.com.ebv.prisma.infrastructure.adapter.persistence.features;

import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;
import br.com.ebv.prisma.infrastructure.adapter.persistence.identity.GoldenRecordJpaRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Component
@Transactional
public class FeatureStoreAdapter implements FeatureStorePort {

    private final FeatureCatalogJpaRepository catalogJpa;
    private final FeatureOnlineJpaRepository onlineJpa;
    private final GoldenRecordJpaRepository goldenRecordJpa;

    public FeatureStoreAdapter(
            FeatureCatalogJpaRepository catalogJpa,
            FeatureOnlineJpaRepository onlineJpa,
            GoldenRecordJpaRepository goldenRecordJpa
    ) {
        this.catalogJpa = catalogJpa;
        this.onlineJpa = onlineJpa;
        this.goldenRecordJpa = goldenRecordJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CatalogEntry> listActiveCatalog() {
        return catalogJpa.findByActiveTrueOrderByNameAsc().stream()
                .map(c -> new CatalogEntry(c.getName(), c.getEntity(), c.getValueType(),
                        c.getMaxAgeSeconds(), c.getOwner(), c.isActive()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CatalogEntry> findCatalog(String name) {
        return catalogJpa.findById(name)
                .map(c -> new CatalogEntry(c.getName(), c.getEntity(), c.getValueType(),
                        c.getMaxAgeSeconds(), c.getOwner(), c.isActive()));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FeatureValue> findAsOf(String documento, String featureName, Instant asOf) {
        OffsetDateTime cut = OffsetDateTime.ofInstant(asOf, ZoneOffset.UTC);
        return onlineJpa.findLatestAsOf(documento, featureName, cut)
                .map(f -> new FeatureValue(
                        f.getFeatureName(),
                        null,
                        f.getValueJson(),
                        f.getEventTs().toInstant()
                ));
    }

    @Override
    public void upsert(String documento, String featureName, String valueJson, Instant eventTs) {
        FeatureOnlineEntity e = new FeatureOnlineEntity();
        e.setDocumento(documento);
        e.setFeatureName(featureName);
        e.setValueJson(valueJson);
        e.setEventTs(OffsetDateTime.ofInstant(eventTs, ZoneOffset.UTC));
        e.setWrittenAt(OffsetDateTime.now(ZoneOffset.UTC));
        onlineJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveGoldenRecords(String documento) {
        return goldenRecordJpa.findActiveByDocumento(documento).size();
    }
}
