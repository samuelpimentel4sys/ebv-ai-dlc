package br.com.ebv.prisma.infrastructure.adapter.genai;

import br.com.ebv.prisma.domain.pj.port.out.GenAiGatewayPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "prisma.genai.enabled", havingValue = "true", matchIfMissing = true)
public class HttpGenAiGatewayAdapter implements GenAiGatewayPort {

    private final RestClient client;

    public HttpGenAiGatewayAdapter(
            @Value("${prisma.genai.base-url:http://localhost:8090}") String baseUrl,
            @Value("${prisma.genai.read-timeout-seconds:180}") int readTimeoutSeconds
    ) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(Math.max(30, readTimeoutSeconds)));
        this.client = RestClient.builder()
                .baseUrl(baseUrl.replaceAll("/$", ""))
                .requestFactory(factory)
                .build();
    }

    @Override
    public UpstreamResponse forward(
            String method,
            String pathAndQuery,
            byte[] body,
            String contentType,
            Map<String, String> forwardHeaders
    ) {
        String path = pathAndQuery.startsWith("/") ? pathAndQuery : "/" + pathAndQuery;
        try {
            var spec = client.method(org.springframework.http.HttpMethod.valueOf(method.toUpperCase()))
                    .uri(path);
            if (forwardHeaders != null) {
                forwardHeaders.forEach((k, v) -> {
                    if (v != null && !v.isBlank()) {
                        spec.header(k, v);
                    }
                });
            }
            if (contentType != null && !contentType.isBlank()) {
                spec.header(HttpHeaders.CONTENT_TYPE, contentType);
            }
            if (body != null && body.length > 0) {
                var entity = spec.body(body).retrieve().toEntity(byte[].class);
                return toUpstream(entity);
            }
            var entity = spec.retrieve().toEntity(byte[].class);
            return toUpstream(entity);
        } catch (RestClientResponseException e) {
            String ct = e.getResponseHeaders() != null
                    ? e.getResponseHeaders().getFirst(HttpHeaders.CONTENT_TYPE)
                    : MediaType.APPLICATION_JSON_VALUE;
            return new UpstreamResponse(
                    e.getStatusCode().value(),
                    e.getResponseBodyAsByteArray(),
                    ct,
                    Map.of()
            );
        }
    }

    private static UpstreamResponse toUpstream(org.springframework.http.ResponseEntity<byte[]> entity) {
        String ct = entity.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
        return new UpstreamResponse(
                entity.getStatusCode().value(),
                entity.getBody() != null ? entity.getBody() : new byte[0],
                ct != null ? ct : MediaType.APPLICATION_JSON_VALUE,
                new LinkedHashMap<>()
        );
    }
}
