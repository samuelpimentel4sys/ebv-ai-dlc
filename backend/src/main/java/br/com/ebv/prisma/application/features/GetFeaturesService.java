package br.com.ebv.prisma.application.features;

import br.com.ebv.prisma.domain.features.exception.AmbiguousIdentityException;
import br.com.ebv.prisma.domain.features.exception.FeatureLeakageException;
import br.com.ebv.prisma.domain.features.exception.FeatureNotFoundException;
import br.com.ebv.prisma.domain.features.port.in.GetFeaturesUseCase;
import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GetFeaturesService implements GetFeaturesUseCase {

    private final FeatureStorePort featureStore;
    private final ObjectMapper objectMapper;

    public GetFeaturesService(FeatureStorePort featureStore, ObjectMapper objectMapper) {
        this.featureStore = featureStore;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public FeaturesResult execute(String documento, Instant asOf, List<String> names) {
        String doc = digits(documento);
        long identities = featureStore.countActiveGoldenRecords(doc);
        if (identities > 1) {
            throw new AmbiguousIdentityException(doc);
        }

        boolean liveRead = asOf == null;
        Instant cut = liveRead ? Instant.now() : asOf;

        List<String> requested = (names == null || names.isEmpty())
                ? featureStore.listActiveCatalog().stream().map(FeatureStorePort.CatalogEntry::name).toList()
                : names;

        Map<String, FeaturePoint> features = new LinkedHashMap<>();
        for (String name : requested) {
            var catalog = featureStore.findCatalog(name)
                    .orElseThrow(() -> new FeatureNotFoundException(name));
            if (!catalog.active()) {
                throw new FeatureNotFoundException(name);
            }
            var value = featureStore.findAsOf(doc, name, cut).orElse(null);
            if (value == null) {
                features.put(name, new FeaturePoint(null, null, true, catalog.maxAgeSeconds()));
                continue;
            }
            if (value.eventTs().isAfter(cut)) {
                throw new FeatureLeakageException("Leakage futuro feature=" + name);
            }
            boolean degraded = Instant.now().getEpochSecond() - value.eventTs().getEpochSecond() > catalog.maxAgeSeconds();
            features.put(name, new FeaturePoint(parseValue(value.rawJson()), value.eventTs(), degraded, catalog.maxAgeSeconds()));
        }
        return new FeaturesResult(doc, cut, liveRead, features);
    }

    private Object parseValue(String rawJson) {
        try {
            JsonNode node = objectMapper.readTree(rawJson);
            if (node.isNumber()) {
                return node.decimalValue();
            }
            if (node.isTextual()) {
                return node.asText();
            }
            if (node.has("value")) {
                return node.get("value").isNumber() ? node.get("value").decimalValue() : node.get("value").asText();
            }
            return rawJson;
        } catch (Exception e) {
            return rawJson;
        }
    }

    private static String digits(String raw) {
        return raw == null ? "" : raw.replaceAll("\\D", "");
    }
}
