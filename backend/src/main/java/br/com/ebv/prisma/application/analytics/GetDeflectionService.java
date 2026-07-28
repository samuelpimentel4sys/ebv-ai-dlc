package br.com.ebv.prisma.application.analytics;

import br.com.ebv.prisma.domain.analytics.port.in.GetDeflectionUseCase;
import br.com.ebv.prisma.domain.analytics.port.out.AnalyticsRepositoryPort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class GetDeflectionService implements GetDeflectionUseCase {

    private final AnalyticsRepositoryPort analyticsRepo;
    private final ObjectMapper objectMapper;

    public GetDeflectionService(AnalyticsRepositoryPort analyticsRepo, ObjectMapper objectMapper) {
        this.analyticsRepo = analyticsRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        LocalDate from = query.from() != null ? query.from() : LocalDate.of(2026, 7, 1);
        LocalDate to = query.to() != null ? query.to() : LocalDate.of(2026, 7, 27);

        var deflection = analyticsRepo.findLatestByKey("DEFLECTION_RATE");
        BigDecimal rate = deflection.map(AnalyticsRepositoryPort.SacMetricRecord::metricValue)
                .orElse(new BigDecimal("0.72"));
        long deflected = 8640;
        long total = 12000;
        long reclass = 310;
        if (deflection.isPresent() && deflection.get().metaJson() != null) {
            try {
                JsonNode meta = objectMapper.readTree(deflection.get().metaJson());
                if (meta.has("deflectedCases")) deflected = meta.get("deflectedCases").asLong();
                if (meta.has("totalCases")) total = meta.get("totalCases").asLong();
                if (meta.has("reclassified48h")) reclass = meta.get("reclassified48h").asLong();
            } catch (Exception ignored) {
                // keep defaults
            }
        }

        BigDecimal baseline = analyticsRepo.findLatestByKey("BASELINE_DEFLECTION")
                .map(AnalyticsRepositoryPort.SacMetricRecord::metricValue)
                .orElse(new BigDecimal("0.18"));
        BigDecimal delta = rate.subtract(baseline).setScale(2, RoundingMode.HALF_UP);

        return new Result(from, to, rate, deflected, total, reclass, baseline, delta);
    }
}
