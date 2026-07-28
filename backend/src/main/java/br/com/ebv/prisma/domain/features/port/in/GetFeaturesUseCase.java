package br.com.ebv.prisma.domain.features.port.in;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface GetFeaturesUseCase {

    record FeaturePoint(Object value, Instant eventTs, boolean degraded, Integer maxAgeSeconds) {}

    record FeaturesResult(String documento, Instant asOf, boolean liveRead, Map<String, FeaturePoint> features) {}

    FeaturesResult execute(String documento, Instant asOf, List<String> names);
}
