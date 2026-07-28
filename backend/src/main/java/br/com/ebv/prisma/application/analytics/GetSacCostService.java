package br.com.ebv.prisma.application.analytics;

import br.com.ebv.prisma.domain.analytics.port.in.GetSacCostUseCase;
import br.com.ebv.prisma.domain.analytics.port.out.AnalyticsRepositoryPort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class GetSacCostService implements GetSacCostUseCase {

    private final AnalyticsRepositoryPort analyticsRepo;
    private final ObjectMapper objectMapper;

    public GetSacCostService(AnalyticsRepositoryPort analyticsRepo, ObjectMapper objectMapper) {
        this.analyticsRepo = analyticsRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        LocalDate from = query.from() != null ? query.from() : LocalDate.of(2026, 7, 1);
        LocalDate to = query.to() != null ? query.to() : LocalDate.of(2026, 7, 27);
        List<ChannelCost> channels = analyticsRepo.findByKey("SAC_COST_AVG").stream()
                .map(m -> new ChannelCost(
                        m.channel() != null ? m.channel() : "UNKNOWN",
                        m.metricValue(),
                        currencyFromMeta(m.metaJson())
                ))
                .toList();
        return new Result(from, to, channels);
    }

    private String currencyFromMeta(String metaJson) {
        if (metaJson == null || metaJson.isBlank()) return "BRL";
        try {
            JsonNode n = objectMapper.readTree(metaJson);
            return n.has("currency") ? n.get("currency").asText("BRL") : "BRL";
        } catch (Exception e) {
            return "BRL";
        }
    }
}
