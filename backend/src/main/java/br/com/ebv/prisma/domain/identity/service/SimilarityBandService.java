package br.com.ebv.prisma.domain.identity.service;

import java.math.BigDecimal;
import java.util.Objects;

/** RN001 — faixas de similaridade. */
public final class SimilarityBandService {

    public enum Band {
        AUTO_MERGE,
        HUMAN_REVIEW,
        DISCARD
    }

    private final BigDecimal autoMergeThreshold;
    private final BigDecimal humanReviewThreshold;

    public SimilarityBandService(BigDecimal autoMergeThreshold, BigDecimal humanReviewThreshold) {
        this.autoMergeThreshold = Objects.requireNonNull(autoMergeThreshold);
        this.humanReviewThreshold = Objects.requireNonNull(humanReviewThreshold);
        if (autoMergeThreshold.compareTo(humanReviewThreshold) < 0) {
            throw new IllegalArgumentException("autoMergeThreshold deve ser >= humanReviewThreshold");
        }
    }

    public static SimilarityBandService defaults() {
        return new SimilarityBandService(new BigDecimal("0.95"), new BigDecimal("0.70"));
    }

    public Band classify(BigDecimal confidence) {
        Objects.requireNonNull(confidence, "confidence");
        if (confidence.compareTo(autoMergeThreshold) >= 0) {
            return Band.AUTO_MERGE;
        }
        if (confidence.compareTo(humanReviewThreshold) >= 0) {
            return Band.HUMAN_REVIEW;
        }
        return Band.DISCARD;
    }
}
