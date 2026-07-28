package br.com.ebv.prisma.infrastructure.adapter.onnx;

import br.com.ebv.prisma.domain.scoring.port.out.OnnxScorerPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "prisma.onnx.mode", havingValue = "http")
public class HttpOnnxScorerAdapter implements OnnxScorerPort {

    private static final Logger log = LoggerFactory.getLogger(HttpOnnxScorerAdapter.class);

    private final RestClient client;

    public HttpOnnxScorerAdapter(@Value("${prisma.onnx.scorer-url}") String baseUrl) {
        this.client = RestClient.builder().baseUrl(baseUrl).build();
    }

    @Override
    public boolean live() {
        try {
            Map<?, ?> health = client.get().uri("/health").retrieve().body(Map.class);
            return health != null && "up".equals(String.valueOf(health.get("status")));
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Optional<BigDecimal> score(List<Double> features) {
        if (features == null || features.isEmpty()) {
            return Optional.empty();
        }
        try {
            Map<String, Object> body = Map.of("features", features);
            Map<String, Object> resp = client.post()
                    .uri("/score")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (resp == null) {
                return Optional.empty();
            }
            Object loaded = resp.get("model_loaded");
            if (loaded instanceof Boolean b && !b) {
                log.warn("ONNX sidecar up but model_loaded=false — fallback fórmula lab");
                return Optional.empty();
            }
            Object score = resp.get("score");
            if (score == null) {
                return Optional.empty();
            }
            BigDecimal value = new BigDecimal(score.toString());
            if (value.compareTo(BigDecimal.ZERO) < 0) {
                return Optional.empty();
            }
            return Optional.of(value.setScale(2, RoundingMode.HALF_UP));
        } catch (Exception e) {
            log.warn("ONNX score falhou: {} — fallback fórmula", e.getMessage());
            return Optional.empty();
        }
    }
}
