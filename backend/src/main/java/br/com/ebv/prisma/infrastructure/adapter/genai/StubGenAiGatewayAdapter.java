package br.com.ebv.prisma.infrastructure.adapter.genai;

import br.com.ebv.prisma.domain.pj.port.out.GenAiGatewayPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

/**
 * Showcase / GenAI off — FE continua em :8080 sem Emilly.
 */
@Component
@ConditionalOnProperty(name = "prisma.genai.enabled", havingValue = "false")
public class StubGenAiGatewayAdapter implements GenAiGatewayPort {

    @Override
    public UpstreamResponse forward(
            String method,
            String pathAndQuery,
            byte[] body,
            String contentType,
            Map<String, String> forwardHeaders
    ) {
        String path = pathAndQuery == null ? "" : pathAndQuery.split("\\?", 2)[0].toLowerCase(Locale.ROOT);
        if (path.endsWith("/health") || path.contains("/genai/health")) {
            return json(200, """
                    {"status":"ok","service":"prisma-pj-stub","env":"showcase","partial":true,"lab":true}
                    """);
        }
        return json(200, """
                {
                  "partial": true,
                  "lab": true,
                  "showcase": true,
                  "message": "GenAI stub — PRISMA_GENAI_ENABLED=false / showcase. Suba Emilly e PRISMA_GENAI_ENABLED=true para real.",
                  "method": "%s",
                  "path": "%s"
                }
                """.formatted(method, escape(pathAndQuery)));
    }

    private static UpstreamResponse json(int status, String payload) {
        return new UpstreamResponse(
                status,
                payload.getBytes(StandardCharsets.UTF_8),
                MediaType.APPLICATION_JSON_VALUE,
                Map.of()
        );
    }

    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
