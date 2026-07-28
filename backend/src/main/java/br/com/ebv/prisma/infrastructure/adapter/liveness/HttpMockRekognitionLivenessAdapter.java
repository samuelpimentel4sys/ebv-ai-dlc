package br.com.ebv.prisma.infrastructure.adapter.liveness;

import br.com.ebv.prisma.domain.liveness.exception.LivenessProviderException;
import br.com.ebv.prisma.domain.liveness.port.out.RekognitionLivenessPort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

/**
 * Lab: WireMock em docker-compose.liveness.yml (porta 8093).
 * Não é AWS real — Face Liveness não existe no LocalStack.
 */
@Component
@ConditionalOnProperty(name = "prisma.liveness.mode", havingValue = "http")
public class HttpMockRekognitionLivenessAdapter implements RekognitionLivenessPort {

    private static final Logger log = LoggerFactory.getLogger(HttpMockRekognitionLivenessAdapter.class);

    private final String baseUrl;
    private final ObjectMapper mapper;
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    public HttpMockRekognitionLivenessAdapter(
            @Value("${prisma.liveness.mock-url:http://localhost:8093}") String baseUrl,
            ObjectMapper mapper
    ) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.mapper = mapper;
    }

    @Override
    public CreatedSession createSession(UUID customerId, String idempotencyKey) {
        try {
            String body = mapper.createObjectNode()
                    .put("ClientRequestToken", idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString())
                    .toString();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/"))
                    .timeout(Duration.ofSeconds(3))
                    .header("Content-Type", "application/x-amz-json-1.1")
                    .header("X-Amz-Target", "RekognitionService.CreateFaceLivenessSession")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 400) {
                throw new LivenessProviderException("mock Rekognition HTTP " + resp.statusCode());
            }
            JsonNode json = mapper.readTree(resp.body());
            String sessionId = json.path("SessionId").asText(null);
            if (sessionId == null || sessionId.isBlank()) {
                sessionId = UUID.randomUUID().toString();
                log.warn("mock sem SessionId — gerando UUID local");
            }
            return new CreatedSession(sessionId);
        } catch (LivenessProviderException e) {
            throw e;
        } catch (Exception e) {
            throw new LivenessProviderException("falha ao chamar LIVENESS_MOCK_URL=" + baseUrl, e);
        }
    }
}
