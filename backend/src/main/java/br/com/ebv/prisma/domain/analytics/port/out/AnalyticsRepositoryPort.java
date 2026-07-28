package br.com.ebv.prisma.domain.analytics.port.out;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnalyticsRepositoryPort {

    record SacMetricRecord(
            UUID id,
            String metricKey,
            String channel,
            LocalDate periodFrom,
            LocalDate periodTo,
            BigDecimal metricValue,
            String metaJson
    ) {}

    List<SacMetricRecord> findByKey(String metricKey);

    Optional<SacMetricRecord> findLatestByKey(String metricKey);

    long countOpenDisputes();

    long countResolvedDisputes();
}
