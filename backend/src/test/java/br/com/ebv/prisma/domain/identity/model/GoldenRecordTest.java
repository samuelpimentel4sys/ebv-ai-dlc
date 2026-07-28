package br.com.ebv.prisma.domain.identity.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GoldenRecordTest {

    @Test
    @DisplayName("cria GR ACTIVE versão 1")
    void create() {
        GoldenRecord gr = GoldenRecord.create(new DocumentoCanonico("12345678901"));
        assertThat(gr.getStatus()).isEqualTo(GoldenRecordStatus.ACTIVE);
        assertThat(gr.getVersion()).isEqualTo(1);
    }

    @Test
    @DisplayName("documento inválido rejeitado")
    void invalidDocumento() {
        assertThatThrownBy(() -> new DocumentoCanonico("123"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
