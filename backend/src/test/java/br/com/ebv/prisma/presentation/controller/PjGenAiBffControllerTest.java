package br.com.ebv.prisma.presentation.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PjGenAiBffControllerTest {

    @Test
    @DisplayName("HITL paths não vão pro proxy GenAI")
    void hitlOwned() {
        assertThat(PjGenAiBffController.isHitlOwned("/api/v1/pj/opinions/abc/submit")).isTrue();
        assertThat(PjGenAiBffController.isHitlOwned("/api/v1/pj/opinions/abc/approve")).isTrue();
        assertThat(PjGenAiBffController.isHitlOwned("/api/v1/pj/opinions/abc/trail")).isTrue();
        assertThat(PjGenAiBffController.isHitlOwned("/api/v1/pj/opinions/abc")).isFalse();
        assertThat(PjGenAiBffController.isHitlOwned("/api/v1/pj/rag/query")).isFalse();
        assertThat(PjGenAiBffController.isHitlOwned("/api/v1/pj/genai/health")).isFalse();
    }
}
