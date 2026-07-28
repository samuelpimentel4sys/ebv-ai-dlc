package br.com.ebv.prisma.domain.identity.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class SimilarityBandServiceTest {

    private final SimilarityBandService service = SimilarityBandService.defaults();

    @Test
    @DisplayName("CT-01 faixa: confidence >= 0.95 → AUTO_MERGE")
    void autoMergeBand() {
        assertThat(service.classify(new BigDecimal("0.95"))).isEqualTo(SimilarityBandService.Band.AUTO_MERGE);
        assertThat(service.classify(new BigDecimal("0.99"))).isEqualTo(SimilarityBandService.Band.AUTO_MERGE);
    }

    @Test
    @DisplayName("CT-02 faixa: 0.70 <= confidence < 0.95 → HUMAN_REVIEW")
    void humanReviewBand() {
        assertThat(service.classify(new BigDecimal("0.70"))).isEqualTo(SimilarityBandService.Band.HUMAN_REVIEW);
        assertThat(service.classify(new BigDecimal("0.94"))).isEqualTo(SimilarityBandService.Band.HUMAN_REVIEW);
    }

    @Test
    @DisplayName("confidence < 0.70 → DISCARD")
    void discardBand() {
        assertThat(service.classify(new BigDecimal("0.69"))).isEqualTo(SimilarityBandService.Band.DISCARD);
    }
}
