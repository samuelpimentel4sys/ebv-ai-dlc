package br.com.ebv.prisma.application.fairness;

import br.com.ebv.prisma.domain.fairness.exception.FairnessValidationException;
import br.com.ebv.prisma.domain.fairness.port.in.AnalyzeFairnessUseCase;
import br.com.ebv.prisma.domain.fairness.port.out.FairlearnEnginePort;
import br.com.ebv.prisma.domain.fairness.port.out.FairnessRepositoryPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AnalyzeFairnessService implements AnalyzeFairnessUseCase {

    public static final String STATUS_QUEUED = "QUEUED";
    public static final String STATUS_DONE = "DONE";
    /** Lab stub threshold — disparity above this opens alert. */
    public static final BigDecimal DEFAULT_LIMIT = new BigDecimal("0.05000000");
    public static final BigDecimal STUB_DISPARITY = new BigDecimal("0.08000000");

    private final FairnessRepositoryPort fairnessRepo;
    private final FairlearnEnginePort fairlearnEngine;
    private final ObjectMapper objectMapper;

    public AnalyzeFairnessService(
            FairnessRepositoryPort fairnessRepo,
            FairlearnEnginePort fairlearnEngine,
            ObjectMapper objectMapper
    ) {
        this.fairnessRepo = fairnessRepo;
        this.fairlearnEngine = fairlearnEngine;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.modelVersion() == null || command.modelVersion().isBlank()) {
            throw new FairnessValidationException("model_version obrigatório");
        }
        if (command.window() == null || command.window().from() == null || command.window().to() == null) {
            throw new FairnessValidationException("window.from e window.to obrigatórios");
        }
        if (command.window().to().isBefore(command.window().from())) {
            throw new IllegalArgumentException("window.to deve ser >= window.from");
        }

        List<String> segments = command.segments() == null || command.segments().isEmpty()
                ? List.of("REGION_PROXY") : command.segments();
        List<String> metrics = command.metrics() == null || command.metrics().isEmpty()
                ? List.of("DEMOGRAPHIC_PARITY") : command.metrics();
        String profile = command.thresholdProfile() == null || command.thresholdProfile().isBlank()
                ? "COMMITTEE-2026-02" : command.thresholdProfile().trim();

        UUID runId = UUID.randomUUID();
        Instant submitted = Instant.now();

        fairnessRepo.saveRun(new FairnessRepositoryPort.RunRecord(
                runId,
                command.modelVersion().trim(),
                command.window().from(),
                command.window().to(),
                profile,
                STATUS_QUEUED,
                toJson(segments),
                toJson(metrics),
                submitted,
                null
        ));

        String metricName = metrics.getFirst();
        String segment = segments.getFirst();
        BigDecimal disparity = STUB_DISPARITY;
        String externalRunId = null;

        if (fairlearnEngine.enabled()) {
            // Lab synthetic sample until Athena/window extract exists
            var eng = fairlearnEngine.analyze(new FairlearnEnginePort.AnalyzeCommand(
                    List.of(1, 0, 1, 0, 1, 0, 1, 0, 1, 0),
                    List.of(1, 0, 1, 1, 1, 0, 0, 0, 1, 0),
                    List.of("A", "A", "A", "A", "A", "B", "B", "B", "B", "B"),
                    segment
            ));
            if (eng.isPresent()) {
                disparity = eng.get().demographicParityDifference();
                externalRunId = eng.get().runId();
            }
        }

        boolean exceeded = disparity.compareTo(DEFAULT_LIMIT) > 0;
        UUID metricId = UUID.randomUUID();
        Instant finished = Instant.now();

        fairnessRepo.saveMetric(new FairnessRepositoryPort.MetricRecord(
                metricId, runId, command.modelVersion().trim(), metricName, segment,
                externalRunId != null ? "FAIRLEARN:" + externalRunId : "GROUP_A",
                disparity, DEFAULT_LIMIT, exceeded, finished
        ));

        boolean alertOpened = false;
        if (exceeded) {
            fairnessRepo.saveAlert(new FairnessRepositoryPort.AlertRecord(
                    UUID.randomUUID(), metricId, command.modelVersion().trim(),
                    "HIGH", "OPEN",
                    "Disparity " + disparity + " > limit " + DEFAULT_LIMIT
                            + (externalRunId != null ? " (fairlearn " + externalRunId + ")" : " (lab stub)"),
                    finished
            ));
            alertOpened = true;
        }

        fairnessRepo.saveRun(new FairnessRepositoryPort.RunRecord(
                runId,
                command.modelVersion().trim(),
                command.window().from(),
                command.window().to(),
                profile,
                STATUS_DONE,
                toJson(segments),
                toJson(metrics),
                submitted,
                finished
        ));

        return new Result(runId, STATUS_DONE, command.modelVersion().trim(), profile, submitted, finished, alertOpened);
    }

    private String toJson(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
