package br.com.ebv.prisma.domain.events.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocumentPartitioningTest {

    @Test
    @DisplayName("RN001 mesmo documento → mesma partição")
    void stablePartition() {
        int p1 = DocumentPartitioning.partitionFor("123.456.789-01", 6);
        int p2 = DocumentPartitioning.partitionFor("12345678901", 6);
        assertThat(p1).isEqualTo(p2);
        assertThat(p1).isBetween(0, 5);
    }

    @Test
    @DisplayName("documentos diferentes podem cair em partições distintas")
    void differentDocs() {
        int a = DocumentPartitioning.partitionFor("12345678901", 6);
        int b = DocumentPartitioning.partitionFor("98765432100", 6);
        // não exige diferença, só validade
        assertThat(a).isBetween(0, 5);
        assertThat(b).isBetween(0, 5);
    }

    @Test
    @DisplayName("documento inválido rejeitado")
    void invalid() {
        assertThatThrownBy(() -> DocumentPartitioning.partitionFor("123", 6))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
