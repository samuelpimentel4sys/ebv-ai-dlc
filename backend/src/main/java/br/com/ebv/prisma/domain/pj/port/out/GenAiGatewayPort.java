package br.com.ebv.prisma.domain.pj.port.out;

import java.util.Map;

/**
 * Ponte Noah → Emilly (GenAI Python). FE nunca chama :8090 direto.
 */
public interface GenAiGatewayPort {

    record UpstreamResponse(int status, byte[] body, String contentType, Map<String, String> headers) {}

    UpstreamResponse forward(
            String method,
            String pathAndQuery,
            byte[] body,
            String contentType,
            Map<String, String> forwardHeaders
    );
}
