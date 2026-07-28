package br.com.ebv.prisma.application.decision;

import br.com.ebv.prisma.domain.decision.exception.SnapshotUnavailableException;
import br.com.ebv.prisma.domain.decision.exception.WormWriteException;
import br.com.ebv.prisma.domain.decision.port.in.CreateDecisionUseCase;
import br.com.ebv.prisma.domain.decision.port.out.DecisionRepositoryPort;
import br.com.ebv.prisma.domain.decision.port.out.WormStoragePort;
import br.com.ebv.prisma.domain.features.port.in.GetFeaturesUseCase;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ScoreRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CreateDecisionService implements CreateDecisionUseCase {

    static final int DEFAULT_BUDGET_MS = 250;
    static final int SLICE_SCORE_MS = 100;
    static final int SLICE_FEATURES_MS = 50;
    static final int SLICE_WORM_MS = 50;
    static final int SLICE_EXPLANATION_MS = 50;

    /** Retention stub — 5 years compliance Object Lock. */
    static final int LOCK_YEARS = 5;

    private final ScoreRepositoryPort scoreRepo;
    private final RecalculateScoreUseCase recalculateScore;
    private final GetFeaturesUseCase getFeatures;
    private final WormStoragePort wormStorage;
    private final DecisionRepositoryPort decisionRepo;
    private final ObjectMapper objectMapper;

    public CreateDecisionService(
            ScoreRepositoryPort scoreRepo,
            RecalculateScoreUseCase recalculateScore,
            GetFeaturesUseCase getFeatures,
            WormStoragePort wormStorage,
            DecisionRepositoryPort decisionRepo,
            ObjectMapper objectMapper
    ) {
        this.scoreRepo = scoreRepo;
        this.recalculateScore = recalculateScore;
        this.getFeatures = getFeatures;
        this.wormStorage = wormStorage;
        this.decisionRepo = decisionRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command cmd) {
        long startNs = System.nanoTime();
        int budgetMs = cmd.budgetMs() > 0 ? cmd.budgetMs() : DEFAULT_BUDGET_MS;
        String doc = digits(cmd.documento());
        if (doc.isBlank()) {
            throw new IllegalArgumentException("documento obrigatório");
        }

        UUID decisionId = UUID.randomUUID();
        List<String> degradedFlags = new ArrayList<>();
        boolean partial = false;
        Instant now = Instant.now();

        ScoreBundle scoreBundle = resolveScore(doc, degradedFlags);
        if (!degradedFlags.isEmpty() && degradedFlags.contains("SCORE_CONTINGENCY")) {
            partial = true;
        }

        Map<String, Object> featuresSubset = Map.of();
        long elapsedMs = elapsed(startNs);
        if (elapsedMs + SLICE_FEATURES_MS <= budgetMs) {
            try {
                var featuresResult = getFeatures.execute(doc, now, List.of());
                featuresSubset = toFeaturesSubset(featuresResult);
                if (featuresResult.features().values().stream().anyMatch(GetFeaturesUseCase.FeaturePoint::degraded)) {
                    degradedFlags.add("FEATURES_DEGRADED");
                    partial = true;
                }
            } catch (Exception ex) {
                // RN001: non-critical omit → partial
                degradedFlags.add("FEATURES_UNAVAILABLE");
                partial = true;
            }
        } else {
            degradedFlags.add("FEATURES_OMITTED_BUDGET");
            partial = true;
        }

        // STUB pending policy engine EP-02: APPROVE if score>=700 else REVIEW if >=500 else REJECT
        String outcome = resolveOutcomeStub(scoreBundle.score());

        String explanationRef = null;
        if (cmd.includeExplanation()) {
            elapsedMs = elapsed(startNs);
            if (elapsedMs + SLICE_EXPLANATION_MS <= budgetMs) {
                explanationRef = "/api/v1/xai/" + decisionId;
            } else {
                degradedFlags.add("EXPLANATION_OMITTED_BUDGET");
                partial = true;
            }
        }

        String prevSha256 = decisionRepo.findLatestByDocumento(doc)
                .map(DecisionRepositoryPort.DecisionRecord::sha256)
                .orElse(null);

        Map<String, Object> snapshotPayload = new LinkedHashMap<>();
        snapshotPayload.put("decisionId", decisionId.toString());
        snapshotPayload.put("documento", doc);
        snapshotPayload.put("score", scoreBundle.score());
        snapshotPayload.put("modelVersion", scoreBundle.modelVersion());
        snapshotPayload.put("outcome", outcome);
        snapshotPayload.put("productCode", cmd.productCode());
        snapshotPayload.put("features", featuresSubset);
        snapshotPayload.put("prevSha256", prevSha256);
        snapshotPayload.put("createdAt", now.toString());
        snapshotPayload.put("partial", partial);
        snapshotPayload.put("degradedFlags", List.copyOf(degradedFlags));

        String canonicalJson = SnapshotHash.toCanonicalJson(objectMapper, snapshotPayload);
        String sha256 = SnapshotHash.sha256Hex(canonicalJson);

        // RN001/RN003: WORM write before response — fail-closed 503
        String storageUri;
        try {
            storageUri = wormStorage.put(decisionId, canonicalJson);
        } catch (WormWriteException e) {
            throw e;
        } catch (Exception e) {
            throw new WormWriteException("Falha gravação WORM: " + e.getMessage(), e);
        }

        int latencyMs = (int) elapsed(startNs);
        LocalDate lockedUntil = LocalDate.ofInstant(now, ZoneOffset.UTC).plusYears(LOCK_YEARS);

        decisionRepo.save(new DecisionRepositoryPort.DecisionRecord(
                decisionId,
                doc,
                scoreBundle.score(),
                scoreBundle.modelVersion(),
                outcome,
                sha256,
                prevSha256,
                storageUri,
                now,
                latencyMs,
                List.copyOf(degradedFlags),
                cmd.clientId(),
                partial,
                cmd.productCode(),
                explanationRef,
                lockedUntil
        ));

        return new Result(
                decisionId,
                scoreBundle.score(),
                outcome,
                scoreBundle.modelVersion(),
                latencyMs,
                partial,
                List.copyOf(degradedFlags),
                explanationRef
        );
    }

    private ScoreBundle resolveScore(String doc, List<String> degradedFlags) {
        var current = scoreRepo.findCurrent(doc);
        if (current.isPresent()) {
            return new ScoreBundle(current.get().score(), current.get().modelVersion());
        }
        try {
            var recalc = recalculateScore.execute(
                    new RecalculateScoreUseCase.Command(doc, "DECISION", true)
            );
            return new ScoreBundle(recalc.score(), recalc.modelVersion());
        } catch (Exception recalcEx) {
            // RN002: FS down → contingency from last score/snapshot; none → 503
            var lastDecision = decisionRepo.findLatestByDocumento(doc);
            if (lastDecision.isPresent()) {
                degradedFlags.add("SCORE_CONTINGENCY");
                return new ScoreBundle(lastDecision.get().score(), lastDecision.get().modelVersion());
            }
            throw new SnapshotUnavailableException(
                    "Sem score/contingência para documento: " + doc
            );
        }
    }

    private static Map<String, Object> toFeaturesSubset(GetFeaturesUseCase.FeaturesResult r) {
        Map<String, Object> subset = new LinkedHashMap<>();
        r.features().forEach((name, point) -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("value", point.value());
            p.put("eventTs", point.eventTs() != null ? point.eventTs().toString() : null);
            p.put("degraded", point.degraded());
            subset.put(name, p);
        });
        return subset;
    }

    /**
     * STUB pending policy engine EP-02: APPROVE if score&gt;=700 else REVIEW if &gt;=500 else REJECT.
     */
    static String resolveOutcomeStub(BigDecimal score) {
        if (score.compareTo(new BigDecimal("700")) >= 0) {
            return "APPROVE";
        }
        if (score.compareTo(new BigDecimal("500")) >= 0) {
            return "REVIEW";
        }
        return "REJECT";
    }

    private static long elapsed(long startNs) {
        return (System.nanoTime() - startNs) / 1_000_000L;
    }

    private static String digits(String raw) {
        return raw == null ? "" : raw.replaceAll("\\D", "");
    }

    private record ScoreBundle(BigDecimal score, String modelVersion) {}
}
