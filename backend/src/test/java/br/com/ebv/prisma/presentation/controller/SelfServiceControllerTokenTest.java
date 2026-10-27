package br.com.ebv.prisma.presentation.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SelfServiceControllerTokenTest {

    @Test
    @DisplayName("query sessionToken (Sofia) resolve")
    void queryToken() {
        assertThat(SelfServiceController.resolveSessionToken(null, "ss-abc")).isEqualTo("ss-abc");
    }

    @Test
    @DisplayName("header X-Session-Token tem prioridade")
    void headerWins() {
        assertThat(SelfServiceController.resolveSessionToken("ss-hdr", "ss-q")).isEqualTo("ss-hdr");
    }

    @Test
    @DisplayName("sem token → 400")
    void missing() {
        assertThatThrownBy(() -> SelfServiceController.resolveSessionToken(null, null))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode().value())
                .isEqualTo(400);
    }
}
