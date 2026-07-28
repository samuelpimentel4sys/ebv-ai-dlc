package br.com.ebv.prisma.infrastructure.adapter.fairlearn;

import br.com.ebv.prisma.domain.fairness.port.out.FairlearnEnginePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "prisma.fairlearn.enabled", havingValue = "true")
public class HttpFairlearnAdapter implements FairlearnEnginePort {

    private static final Logger log = LoggerFactory.getLogger(HttpFairlearnAdapter.class);

    private final RestClient client;

    public HttpFairlearnAdapter(@Value("${prisma.fairlearn.url}") String baseUrl) {
        this.client = RestClient.builder().baseUrl(baseUrl).build();
    }

    @Override
    public boolean enabled() {
        return true;
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<AnalyzeResult> analyze(AnalyzeCommand command) {
        try {
            Map<String, Object> body = Map.of(
                    "y_true", command.yTrue(),
                    "y_pred", command.yPred(),
                    "sensitive_feature", command.sensitiveFeature(),
                    "feature_name", command.featureName() == null ? "group" : command.featureName()
            );
            Map<String, Object> resp = client.post()
                    .uri("/analyze")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (resp == null || resp.get("run_id") == null) {
                return Optional.empty();
            }
            String runId = String.valueOf(resp.get("run_id"));
            String status = String.valueOf(resp.getOrDefault("status", "completed"));

            BigDecimal dp = BigDecimal.ZERO;
            BigDecimal eo = BigDecimal.ZERO;
            Map<String, Object> metricsResp = client.get().uri("/metrics").retrieve().body(Map.class);
            if (metricsResp != null && metricsResp.get("runs") instanceof List<?> runs) {
                for (Object item : runs) {
                    if (!(item instanceof Map<?, ?> run)) {
                        continue;
                    }
                    if (!runId.equals(String.valueOf(run.get("run_id")))) {
                        continue;
                    }
                    Object metricsObj = run.get("metrics");
                    if (metricsObj instanceof Map<?, ?> metrics) {
                        dp = toBd(metrics.get("demographic_parity_difference"));
                        eo = toBd(metrics.get("equalized_odds_difference"));
                    }
                    break;
                }
            }
            return Optional.of(new AnalyzeResult(runId, status, dp, eo));
        } catch (Exception e) {
            log.warn("Fairlearn analyze falhou: {} — fallback stub", e.getMessage());
            return Optional.empty();
        }
    }

    private static BigDecimal toBd(Object v) {
        if (v == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(v.toString());
    }
}
