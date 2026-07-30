package br.com.ebv.prisma.infrastructure.adapter.genai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class StubGenAiGatewayAdapterTest {

    @Test
    @DisplayName("health stub showcase")
    void healthStub() {
        var stub = new StubGenAiGatewayAdapter();
        var r = stub.forward("GET", "/health", null, null, Map.of());
        assertThat(r.status()).isEqualTo(200);
        String body = new String(r.body(), StandardCharsets.UTF_8);
        assertThat(body).contains("prisma-pj-stub");
        assertThat(body).contains("showcase");
    }

    @Test
    @DisplayName("path genérico retorna partial stub")
    void genericStub() {
        var stub = new StubGenAiGatewayAdapter();
        var r = stub.forward("POST", "/api/v1/pj/rag/query", "{}".getBytes(), "application/json", Map.of());
        assertThat(r.status()).isEqualTo(200);
        assertThat(new String(r.body(), StandardCharsets.UTF_8)).contains("\"showcase\": true");
    }
}
