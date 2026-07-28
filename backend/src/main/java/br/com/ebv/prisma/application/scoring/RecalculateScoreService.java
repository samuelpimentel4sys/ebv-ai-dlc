package br.com.ebv.prisma.application.scoring;

import br.com.ebv.prisma.domain.features.port.out.FeatureStorePort;
import br.com.ebv.prisma.domain.scoring.exception.ModelUnavailableException;
import br.com.ebv.prisma.domain.scoring.port.in.RecalculateScoreUseCase;
import br.com.ebv.prisma.domain.scoring.port.out.ModelRegistryPort;
import br.com.ebv.prisma.domain.scoring.port.out.OnnxScorerPort;
import br.com.ebv.prisma.domain.scoring.port.out.ScoreRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RecalculateScoreService implements RecalculateScoreUseCase {

    static final String SCORING_MODEL_ID = "score-vivo";
    private static final long COALESCE_WINDOW_MS = 5_000L;

    private static final BigDecimal BASELINE = new BigDecimal("700");
    private static final BigDecimal NEG_PENALTY = new BigDecimal("15");
    private static final BigDecimal DIVIDA_DIVISOR = new BigDecimal("1000");
    private static final BigDecimal SCORE_MIN = new BigDecimal("300");
    private static final BigDecimal SCORE_MAX = new BigDecimal("900");

    private final Map<String, Instant> lastCalcTime = new ConcurrentHashMap<>();

    private final ModelRegistryPort modelRegistry;
    private final ScoreRepositoryPort scoreRepo;
    private final FeatureStorePort featureStore;
    private final OnnxScorerPort onnxScorer;

    public RecalculateScoreService(
            ModelRegistryPort modelRegistry,
            ScoreRepositoryPort scoreRepo,
            FeatureStorePort featureStore,
            OnnxScorerPort onnxScorer
    ) {
        this.modelRegistry = modelRegistry;
        this.scoreRepo = scoreRepo;
        this.featureStore = featureStore;
        this.onnxScorer = onnxScorer;
    }

    @Override
    @Transactional
    public Result execute(Command cmd) {
        String doc = digits(cmd.documento());

        var model = modelRegistry.findProduction(SCORING_MODEL_ID)
                .orElseThrow(() -> new ModelUnavailableException(SCORING_MODEL_ID));

        if (!cmd.critical()) {
            Instant last = lastCalcTime.get(doc);
            if (last != null && Instant.now().toEpochMilli() - last.toEpochMilli() < COALESCE_WINDOW_MS) {
                var current = scoreRepo.findCurrent(doc);
                if (current.isPresent()) {
                    return new Result(doc, current.get().score(), current.get().modelVersion(), true);
                }
            }
        }

        BigDecimal score = computeScore(doc);

        scoreRepo.saveCurrent(doc, score, model.version());
        scoreRepo.saveHistory(doc, score, model.version(), cmd.reason());
        lastCalcTime.put(doc, Instant.now());

        return new Result(doc, score, model.version(), false);
    }

    private BigDecimal computeScore(String doc) {
        Instant now = Instant.now();
        BigDecimal divida = BigDecimal.ZERO;
        BigDecimal neg = BigDecimal.ZERO;
        boolean hasFeatures = false;

        var dividaOpt = featureStore.findAsOf(doc, "divida_aberta", now);
        var negOpt = featureStore.findAsOf(doc, "qtd_negativacoes_12m", now);

        if (dividaOpt.isPresent()) {
            hasFeatures = true;
            divida = parseNumeric(dividaOpt.get().rawJson());
        }
        if (negOpt.isPresent()) {
            hasFeatures = true;
            neg = parseNumeric(negOpt.get().rawJson());
        }

        if (onnxScorer.live()) {
            var onnx = onnxScorer.score(List.of(divida.doubleValue(), neg.doubleValue()));
            if (onnx.isPresent()) {
                return onnx.get().max(SCORE_MIN).min(SCORE_MAX).setScale(2, RoundingMode.HALF_UP);
            }
        }

        BigDecimal score = BASELINE;
        if (hasFeatures) {
            score = score.subtract(divida.divide(DIVIDA_DIVISOR, 2, RoundingMode.HALF_UP));
            score = score.subtract(neg.multiply(NEG_PENALTY));
        }

        return score.max(SCORE_MIN).min(SCORE_MAX).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal parseNumeric(String rawJson) {
        if (rawJson == null) return BigDecimal.ZERO;
        try {
            String trimmed = rawJson.trim();
            if (trimmed.startsWith("{") || trimmed.startsWith("\"")) {
                return BigDecimal.ZERO;
            }
            return new BigDecimal(trimmed);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static String digits(String raw) {
        return raw == null ? "" : raw.replaceAll("\\D", "");
    }
}
