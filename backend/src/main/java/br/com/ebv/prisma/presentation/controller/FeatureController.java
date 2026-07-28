package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.features.port.in.BatchFeaturesUseCase;
import br.com.ebv.prisma.domain.features.port.in.GetFeaturesUseCase;
import br.com.ebv.prisma.domain.features.port.in.ListFeatureCatalogUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/features")
@Tag(name = "Features", description = "PRISMA-EP-01-F02 Feature Store PIT")
public class FeatureController {

    private final GetFeaturesUseCase getFeatures;
    private final BatchFeaturesUseCase batchFeatures;
    private final ListFeatureCatalogUseCase catalog;

    public FeatureController(
            GetFeaturesUseCase getFeatures,
            BatchFeaturesUseCase batchFeatures,
            ListFeatureCatalogUseCase catalog
    ) {
        this.getFeatures = getFeatures;
        this.batchFeatures = batchFeatures;
        this.catalog = catalog;
    }

    @GetMapping("/catalog")
    @Operation(summary = "Catálogo de atributos ativos")
    public List<Map<String, Object>> catalog() {
        return catalog.execute().stream()
                .map(c -> Map.<String, Object>of(
                        "name", c.name(),
                        "entity", c.entity(),
                        "valueType", c.valueType(),
                        "maxAgeSeconds", c.maxAgeSeconds(),
                        "owner", c.owner(),
                        "active", c.active()
                ))
                .toList();
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Features PIT do titular")
    public Map<String, Object> get(
            @PathVariable String documento,
            @RequestParam(required = false) Instant asOf,
            @RequestParam(required = false) List<String> names
    ) {
        return toResponse(getFeatures.execute(documento, asOf, names));
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch PIT")
    public Map<String, Object> batch(@RequestBody List<Map<String, Object>> body) {
        List<BatchFeaturesUseCase.BatchItem> items = body.stream()
                .map(m -> new BatchFeaturesUseCase.BatchItem(
                        String.valueOf(m.get("documento")),
                        m.get("asOf") != null ? Instant.parse(String.valueOf(m.get("asOf"))) : null,
                        castNames(m.get("names"))
                ))
                .toList();
        var result = batchFeatures.execute(items);
        return Map.of("items", result.items().stream().map(this::toResponse).toList());
    }

    @SuppressWarnings("unchecked")
    private static List<String> castNames(Object raw) {
        if (raw instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private Map<String, Object> toResponse(GetFeaturesUseCase.FeaturesResult r) {
        Map<String, Object> features = new LinkedHashMap<>();
        r.features().forEach((k, v) -> {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("value", v.value());
            point.put("eventTs", v.eventTs() != null ? v.eventTs().toString() : null);
            point.put("degraded", v.degraded());
            if (v.degraded() && v.maxAgeSeconds() != null) {
                point.put("maxAgeSeconds", v.maxAgeSeconds());
            }
            features.put(k, point);
        });
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("documento", r.documento());
        resp.put("asOf", r.asOf().toString());
        resp.put("liveRead", r.liveRead());
        resp.put("features", features);
        return resp;
    }
}
