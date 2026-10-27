package br.com.ebv.prisma.infrastructure.adapter.genai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HttpGenAiGatewayAdapterTest {

    @Test
    @DisplayName("Emilly down → 503 JSON, não 500")
    void connectionRefusedMapsTo503() {
        var adapter = new HttpGenAiGatewayAdapter("http://127.0.0.1:1", 30);
        var r = adapter.forward("GET", "/health", null, null, Map.of());
        assertThat(r.status()).isEqualTo(503);
        String body = new String(r.body(), StandardCharsets.UTF_8);
        assertThat(body).contains("\"status\":\"DOWN\"");
        assertThat(body).contains("emilly");
        assertThat(body).contains("unavailable");
    }
}
