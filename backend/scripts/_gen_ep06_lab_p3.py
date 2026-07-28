# -*- coding: utf-8 -*-
"""EP-06 lab generator part 3: F02 thinfile + F09 monitoring + F03 coach + F06 simulate."""
from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "src/main/java/br/com/ebv/prisma"
TEST = ROOT / "src/test/java/br/com/ebv/prisma"


def w(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print("W", path.relative_to(ROOT))


# ===================== F02 + F09 Thinfile =====================
w(MAIN / "domain/thinfile/exception/ThinfileNotFoundException.java", """
package br.com.ebv.prisma.domain.thinfile.exception;

public class ThinfileNotFoundException extends RuntimeException {
    public ThinfileNotFoundException(String message) { super(message); }
}
""")
w(MAIN / "domain/thinfile/exception/ThinfileValidationException.java", """
package br.com.ebv.prisma.domain.thinfile.exception;

public class ThinfileValidationException extends RuntimeException {
    public ThinfileValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/thinfile/port/out/ThinfileRepositoryPort.java", """
package br.com.ebv.prisma.domain.thinfile.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ThinfileRepositoryPort {

    record ModelCard(
            String modelVersion, Instant trainedAt, Instant validatedAt, String populationDesc,
            BigDecimal auc, BigDecimal confidenceFloor, String limitationsJson, boolean active
    ) {}

    record ScoreRecord(
            UUID scoreId, String documentoHash, String modelVersion, int scoreValue,
            String confidenceBand, boolean thinFileFlag, boolean routedToTraditional,
            Instant calculatedAt, UUID correlationId
    ) {}

    record MonitoringRun(
            UUID runId, String modelVersion, Instant startedAt, Instant finishedAt, String status,
            BigDecimal aucCurrent, BigDecimal aucBaseline, BigDecimal degradationPct
    ) {}

    record DriftMetric(UUID metricId, UUID runId, String featureName, BigDecimal psi,
                       boolean vulnerableSegment, String severity) {}

    Optional<ModelCard> findActiveModelCard();
    void saveScore(ScoreRecord record);
    Optional<ScoreRecord> findLatestScore(String documentoHash);
    void saveMonitoringRun(MonitoringRun run);
    void saveDrift(DriftMetric metric);
    List<MonitoringRun> findMonitoringRuns();
    List<DriftMetric> findDriftByRun(UUID runId);
    Optional<MonitoringRun> findLatestRun();
}
""")
w(MAIN / "domain/thinfile/port/in/CalculateThinfileScoreUseCase.java", """
package br.com.ebv.prisma.domain.thinfile.port.in;

import java.util.UUID;

public interface CalculateThinfileScoreUseCase {
    record Command(String documento, Integer traditionalHistoryCount) {}
    record Result(UUID scoreId, int scoreValue, String confidenceBand, boolean thinFileFlag,
                  boolean routedToTraditional, String modelVersion) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/thinfile/port/in/GetThinfileModelCardUseCase.java", """
package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;

public interface GetThinfileModelCardUseCase {
    record Result(String modelVersion, String populationDesc, BigDecimal auc,
                  BigDecimal confidenceFloor, boolean active) {}
    Result execute();
}
""")
w(MAIN / "domain/thinfile/port/in/GetThinfileScoreUseCase.java", """
package br.com.ebv.prisma.domain.thinfile.port.in;

import java.util.UUID;

public interface GetThinfileScoreUseCase {
    record Query(String documento) {}
    record Result(UUID scoreId, int scoreValue, String confidenceBand, String modelVersion, boolean thinFileFlag) {}
    Result execute(Query query);
}
""")
w(MAIN / "domain/thinfile/port/in/EvaluateThinfileMonitoringUseCase.java", """
package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface EvaluateThinfileMonitoringUseCase {
    record Command(String modelVersion, BigDecimal aucCurrent) {}
    record Result(UUID runId, String status, BigDecimal degradationPct, String actionTaken) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/thinfile/port/in/GetThinfileMonitoringUseCase.java", """
package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface GetThinfileMonitoringUseCase {
    record Item(UUID runId, String modelVersion, String status, BigDecimal aucCurrent, BigDecimal degradationPct) {}
    record Result(List<Item> runs) {}
    Result execute();
}
""")
w(MAIN / "domain/thinfile/port/in/GetThinfileDriftUseCase.java", """
package br.com.ebv.prisma.domain.thinfile.port.in;

import java.math.BigDecimal;
import java.util.List;

public interface GetThinfileDriftUseCase {
    record Item(String featureName, BigDecimal psi, String severity, boolean vulnerableSegment) {}
    record Result(List<Item> metrics) {}
    Result execute();
}
""")
w(MAIN / "application/thinfile/CalculateThinfileScoreService.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.exception.ThinfileValidationException;
import br.com.ebv.prisma.domain.thinfile.port.in.CalculateThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class CalculateThinfileScoreService implements CalculateThinfileScoreUseCase {

    private final ThinfileRepositoryPort repo;

    public CalculateThinfileScoreService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.documento().isBlank()) {
            throw new ThinfileValidationException("documento obrigatório");
        }
        int history = command.traditionalHistoryCount() != null ? command.traditionalHistoryCount() : 0;
        boolean thin = history < 3;
        var card = repo.findActiveModelCard().orElseThrow(() ->
                new ThinfileValidationException("model card ativo ausente"));
        UUID id = UUID.randomUUID();
        int score = thin ? 520 : 650;
        String band = thin ? "MEDIUM" : "HIGH";
        repo.saveScore(new ThinfileRepositoryPort.ScoreRecord(
                id, sha256(command.documento().trim()), card.modelVersion(), score, band,
                thin, !thin, Instant.now(), UUID.randomUUID()
        ));
        return new Result(id, score, band, thin, !thin, card.modelVersion());
    }

    static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
""")
w(MAIN / "application/thinfile/GetThinfileModelCardService.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.exception.ThinfileNotFoundException;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileModelCardUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetThinfileModelCardService implements GetThinfileModelCardUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileModelCardService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        var card = repo.findActiveModelCard()
                .orElseThrow(() -> new ThinfileNotFoundException("model card não encontrado"));
        return new Result(card.modelVersion(), card.populationDesc(), card.auc(),
                card.confidenceFloor(), card.active());
    }
}
""")
w(MAIN / "application/thinfile/GetThinfileScoreService.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.exception.ThinfileNotFoundException;
import br.com.ebv.prisma.domain.thinfile.exception.ThinfileValidationException;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetThinfileScoreService implements GetThinfileScoreUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileScoreService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new ThinfileValidationException("documento obrigatório");
        }
        var score = repo.findLatestScore(CalculateThinfileScoreService.sha256(query.documento().trim()))
                .orElseThrow(() -> new ThinfileNotFoundException("score thin-file não encontrado"));
        return new Result(score.scoreId(), score.scoreValue(), score.confidenceBand(),
                score.modelVersion(), score.thinFileFlag());
    }
}
""")
w(MAIN / "application/thinfile/EvaluateThinfileMonitoringService.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.EvaluateThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
public class EvaluateThinfileMonitoringService implements EvaluateThinfileMonitoringUseCase {

    private final ThinfileRepositoryPort repo;

    public EvaluateThinfileMonitoringService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        String version = command.modelVersion() != null ? command.modelVersion() : "tf-lab-1.0";
        BigDecimal auc = command.aucCurrent() != null ? command.aucCurrent() : new BigDecimal("0.70");
        BigDecimal baseline = new BigDecimal("0.72");
        BigDecimal deg = baseline.subtract(auc).divide(baseline, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
        String status = deg.compareTo(new BigDecimal("5")) > 0 ? "ALERT" : "OK";
        String action = status.equals("ALERT") ? "NOTIFY_MODEL_OPS" : "NONE";
        UUID runId = UUID.randomUUID();
        Instant now = Instant.now();
        repo.saveMonitoringRun(new ThinfileRepositoryPort.MonitoringRun(
                runId, version, now, now, status, auc, baseline, deg
        ));
        repo.saveDrift(new ThinfileRepositoryPort.DriftMetric(
                UUID.randomUUID(), runId, "punctuality_index", new BigDecimal("0.1200"),
                false, deg.compareTo(new BigDecimal("5")) > 0 ? "HIGH" : "LOW"
        ));
        return new Result(runId, status, deg, action);
    }
}
""")
w(MAIN / "application/thinfile/GetThinfileMonitoringService.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetThinfileMonitoringService implements GetThinfileMonitoringUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileMonitoringService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        var items = repo.findMonitoringRuns().stream()
                .map(r -> new Item(r.runId(), r.modelVersion(), r.status(), r.aucCurrent(), r.degradationPct()))
                .toList();
        return new Result(items);
    }
}
""")
w(MAIN / "application/thinfile/GetThinfileDriftService.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileDriftUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GetThinfileDriftService implements GetThinfileDriftUseCase {

    private final ThinfileRepositoryPort repo;

    public GetThinfileDriftService(ThinfileRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute() {
        return repo.findLatestRun()
                .map(run -> {
                    var items = repo.findDriftByRun(run.runId()).stream()
                            .map(d -> new Item(d.featureName(), d.psi(), d.severity(), d.vulnerableSegment()))
                            .toList();
                    return new Result(items);
                })
                .orElseGet(() -> new Result(List.of()));
    }
}
""")

# Persistence thinfile - need ModelCard, Score, Monitoring, Drift entities
w(MAIN / "infrastructure/adapter/persistence/thinfile/ThinfileModelCardEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tb_thinfile_model_card")
public class ThinfileModelCardEntity {
    @Id @Column(name = "model_version") private String modelVersion;
    @Column(name = "trained_at", nullable = false) private OffsetDateTime trainedAt;
    @Column(name = "validated_at", nullable = false) private OffsetDateTime validatedAt;
    @Column(name = "population_desc", nullable = false) private String populationDesc;
    private BigDecimal auc;
    @Column(name = "confidence_floor", nullable = false) private BigDecimal confidenceFloor;
    @Column(name = "limitations_json", nullable = false) private String limitationsJson;
    @Column(nullable = false) private Boolean active;

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public OffsetDateTime getTrainedAt() { return trainedAt; }
    public void setTrainedAt(OffsetDateTime trainedAt) { this.trainedAt = trainedAt; }
    public OffsetDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(OffsetDateTime validatedAt) { this.validatedAt = validatedAt; }
    public String getPopulationDesc() { return populationDesc; }
    public void setPopulationDesc(String populationDesc) { this.populationDesc = populationDesc; }
    public BigDecimal getAuc() { return auc; }
    public void setAuc(BigDecimal auc) { this.auc = auc; }
    public BigDecimal getConfidenceFloor() { return confidenceFloor; }
    public void setConfidenceFloor(BigDecimal confidenceFloor) { this.confidenceFloor = confidenceFloor; }
    public String getLimitationsJson() { return limitationsJson; }
    public void setLimitationsJson(String limitationsJson) { this.limitationsJson = limitationsJson; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/ThinfileScoreEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_thinfile_score")
public class ThinfileScoreEntity {
    @Id @Column(name = "score_id") private UUID scoreId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "model_version", nullable = false) private String modelVersion;
    @Column(name = "score_value", nullable = false) private Integer scoreValue;
    @Column(name = "confidence_band", nullable = false) private String confidenceBand;
    @Column(name = "thin_file_flag", nullable = false) private Boolean thinFileFlag;
    @Column(name = "routed_to_traditional", nullable = false) private Boolean routedToTraditional;
    @Column(name = "calculated_at", nullable = false) private OffsetDateTime calculatedAt;
    @Column(name = "correlation_id", nullable = false) private UUID correlationId;

    public UUID getScoreId() { return scoreId; }
    public void setScoreId(UUID scoreId) { this.scoreId = scoreId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public Integer getScoreValue() { return scoreValue; }
    public void setScoreValue(Integer scoreValue) { this.scoreValue = scoreValue; }
    public String getConfidenceBand() { return confidenceBand; }
    public void setConfidenceBand(String confidenceBand) { this.confidenceBand = confidenceBand; }
    public Boolean getThinFileFlag() { return thinFileFlag; }
    public void setThinFileFlag(Boolean thinFileFlag) { this.thinFileFlag = thinFileFlag; }
    public Boolean getRoutedToTraditional() { return routedToTraditional; }
    public void setRoutedToTraditional(Boolean routedToTraditional) { this.routedToTraditional = routedToTraditional; }
    public OffsetDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(OffsetDateTime calculatedAt) { this.calculatedAt = calculatedAt; }
    public UUID getCorrelationId() { return correlationId; }
    public void setCorrelationId(UUID correlationId) { this.correlationId = correlationId; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/TfMonitoringRunEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_tf_monitoring_run")
public class TfMonitoringRunEntity {
    @Id @Column(name = "run_id") private UUID runId;
    @Column(name = "model_version", nullable = false) private String modelVersion;
    @Column(name = "started_at", nullable = false) private OffsetDateTime startedAt;
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    @Column(nullable = false) private String status;
    @Column(name = "auc_current") private BigDecimal aucCurrent;
    @Column(name = "auc_baseline") private BigDecimal aucBaseline;
    @Column(name = "degradation_pct") private BigDecimal degradationPct;

    public UUID getRunId() { return runId; }
    public void setRunId(UUID runId) { this.runId = runId; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getAucCurrent() { return aucCurrent; }
    public void setAucCurrent(BigDecimal aucCurrent) { this.aucCurrent = aucCurrent; }
    public BigDecimal getAucBaseline() { return aucBaseline; }
    public void setAucBaseline(BigDecimal aucBaseline) { this.aucBaseline = aucBaseline; }
    public BigDecimal getDegradationPct() { return degradationPct; }
    public void setDegradationPct(BigDecimal degradationPct) { this.degradationPct = degradationPct; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/TfDriftMetricEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tb_tf_drift_metric")
public class TfDriftMetricEntity {
    @Id @Column(name = "metric_id") private UUID metricId;
    @Column(name = "run_id", nullable = false) private UUID runId;
    @Column(name = "feature_name", nullable = false) private String featureName;
    @Column(nullable = false) private BigDecimal psi;
    @Column(name = "vulnerable_segment", nullable = false) private Boolean vulnerableSegment;
    @Column(nullable = false) private String severity;

    public UUID getMetricId() { return metricId; }
    public void setMetricId(UUID metricId) { this.metricId = metricId; }
    public UUID getRunId() { return runId; }
    public void setRunId(UUID runId) { this.runId = runId; }
    public String getFeatureName() { return featureName; }
    public void setFeatureName(String featureName) { this.featureName = featureName; }
    public BigDecimal getPsi() { return psi; }
    public void setPsi(BigDecimal psi) { this.psi = psi; }
    public Boolean getVulnerableSegment() { return vulnerableSegment; }
    public void setVulnerableSegment(Boolean vulnerableSegment) { this.vulnerableSegment = vulnerableSegment; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/ThinfileModelCardJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThinfileModelCardJpaRepository extends JpaRepository<ThinfileModelCardEntity, String> {
    Optional<ThinfileModelCardEntity> findFirstByActiveTrue();
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/ThinfileScoreJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ThinfileScoreJpaRepository extends JpaRepository<ThinfileScoreEntity, UUID> {
    Optional<ThinfileScoreEntity> findFirstByDocumentoHashOrderByCalculatedAtDesc(String documentoHash);
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/TfMonitoringRunJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TfMonitoringRunJpaRepository extends JpaRepository<TfMonitoringRunEntity, UUID> {
    List<TfMonitoringRunEntity> findAllByOrderByStartedAtDesc();
    Optional<TfMonitoringRunEntity> findFirstByOrderByStartedAtDesc();
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/TfDriftMetricJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TfDriftMetricJpaRepository extends JpaRepository<TfDriftMetricEntity, UUID> {
    List<TfDriftMetricEntity> findByRunId(UUID runId);
}
""")
w(MAIN / "infrastructure/adapter/persistence/thinfile/ThinfileRepositoryAdapter.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class ThinfileRepositoryAdapter implements ThinfileRepositoryPort {

    private final ThinfileModelCardJpaRepository modelCardJpa;
    private final ThinfileScoreJpaRepository scoreJpa;
    private final TfMonitoringRunJpaRepository runJpa;
    private final TfDriftMetricJpaRepository driftJpa;

    public ThinfileRepositoryAdapter(
            ThinfileModelCardJpaRepository modelCardJpa,
            ThinfileScoreJpaRepository scoreJpa,
            TfMonitoringRunJpaRepository runJpa,
            TfDriftMetricJpaRepository driftJpa
    ) {
        this.modelCardJpa = modelCardJpa;
        this.scoreJpa = scoreJpa;
        this.runJpa = runJpa;
        this.driftJpa = driftJpa;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ModelCard> findActiveModelCard() {
        return modelCardJpa.findFirstByActiveTrue().map(e -> new ModelCard(
                e.getModelVersion(), e.getTrainedAt().toInstant(), e.getValidatedAt().toInstant(),
                e.getPopulationDesc(), e.getAuc(), e.getConfidenceFloor(), e.getLimitationsJson(),
                Boolean.TRUE.equals(e.getActive())
        ));
    }

    @Override
    public void saveScore(ScoreRecord record) {
        ThinfileScoreEntity e = new ThinfileScoreEntity();
        e.setScoreId(record.scoreId());
        e.setDocumentoHash(record.documentoHash());
        e.setModelVersion(record.modelVersion());
        e.setScoreValue(record.scoreValue());
        e.setConfidenceBand(record.confidenceBand());
        e.setThinFileFlag(record.thinFileFlag());
        e.setRoutedToTraditional(record.routedToTraditional());
        e.setCalculatedAt(OffsetDateTime.ofInstant(record.calculatedAt(), ZoneOffset.UTC));
        e.setCorrelationId(record.correlationId());
        scoreJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ScoreRecord> findLatestScore(String documentoHash) {
        return scoreJpa.findFirstByDocumentoHashOrderByCalculatedAtDesc(documentoHash).map(e -> new ScoreRecord(
                e.getScoreId(), e.getDocumentoHash(), e.getModelVersion(), e.getScoreValue(),
                e.getConfidenceBand(), e.getThinFileFlag(), e.getRoutedToTraditional(),
                e.getCalculatedAt().toInstant(), e.getCorrelationId()
        ));
    }

    @Override
    public void saveMonitoringRun(MonitoringRun run) {
        TfMonitoringRunEntity e = new TfMonitoringRunEntity();
        e.setRunId(run.runId());
        e.setModelVersion(run.modelVersion());
        e.setStartedAt(OffsetDateTime.ofInstant(run.startedAt(), ZoneOffset.UTC));
        e.setFinishedAt(run.finishedAt() == null ? null : OffsetDateTime.ofInstant(run.finishedAt(), ZoneOffset.UTC));
        e.setStatus(run.status());
        e.setAucCurrent(run.aucCurrent());
        e.setAucBaseline(run.aucBaseline());
        e.setDegradationPct(run.degradationPct());
        runJpa.save(e);
    }

    @Override
    public void saveDrift(DriftMetric metric) {
        TfDriftMetricEntity e = new TfDriftMetricEntity();
        e.setMetricId(metric.metricId());
        e.setRunId(metric.runId());
        e.setFeatureName(metric.featureName());
        e.setPsi(metric.psi());
        e.setVulnerableSegment(metric.vulnerableSegment());
        e.setSeverity(metric.severity());
        driftJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MonitoringRun> findMonitoringRuns() {
        return runJpa.findAllByOrderByStartedAtDesc().stream().map(this::toRun).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DriftMetric> findDriftByRun(UUID runId) {
        return driftJpa.findByRunId(runId).stream()
                .map(e -> new DriftMetric(e.getMetricId(), e.getRunId(), e.getFeatureName(),
                        e.getPsi(), e.getVulnerableSegment(), e.getSeverity()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MonitoringRun> findLatestRun() {
        return runJpa.findFirstByOrderByStartedAtDesc().map(this::toRun);
    }

    private MonitoringRun toRun(TfMonitoringRunEntity e) {
        return new MonitoringRun(
                e.getRunId(), e.getModelVersion(), e.getStartedAt().toInstant(),
                e.getFinishedAt() == null ? null : e.getFinishedAt().toInstant(),
                e.getStatus(), e.getAucCurrent(), e.getAucBaseline(), e.getDegradationPct()
        );
    }
}
""")
w(MAIN / "presentation/dto/thinfile/CalculateThinfileScoreRequest.java", """
package br.com.ebv.prisma.presentation.dto.thinfile;

import jakarta.validation.constraints.NotBlank;

public record CalculateThinfileScoreRequest(
        @NotBlank String documento,
        Integer traditionalHistoryCount
) {}
""")
w(MAIN / "presentation/dto/thinfile/EvaluateMonitoringRequest.java", """
package br.com.ebv.prisma.presentation.dto.thinfile;

import java.math.BigDecimal;

public record EvaluateMonitoringRequest(String modelVersion, BigDecimal aucCurrent) {}
""")
w(MAIN / "presentation/controller/ThinfileController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.thinfile.port.in.CalculateThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.EvaluateThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileDriftUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileModelCardUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileMonitoringUseCase;
import br.com.ebv.prisma.domain.thinfile.port.in.GetThinfileScoreUseCase;
import br.com.ebv.prisma.presentation.dto.thinfile.CalculateThinfileScoreRequest;
import br.com.ebv.prisma.presentation.dto.thinfile.EvaluateMonitoringRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/thinfile")
@Tag(name = "Thin-File", description = "PRISMA-EP-06-F02/F09 Score thin-file + monitoring")
public class ThinfileController {

    private final CalculateThinfileScoreUseCase calculate;
    private final GetThinfileModelCardUseCase modelCard;
    private final GetThinfileScoreUseCase getScore;
    private final EvaluateThinfileMonitoringUseCase evaluate;
    private final GetThinfileMonitoringUseCase monitoring;
    private final GetThinfileDriftUseCase drift;

    public ThinfileController(
            CalculateThinfileScoreUseCase calculate,
            GetThinfileModelCardUseCase modelCard,
            GetThinfileScoreUseCase getScore,
            EvaluateThinfileMonitoringUseCase evaluate,
            GetThinfileMonitoringUseCase monitoring,
            GetThinfileDriftUseCase drift
    ) {
        this.calculate = calculate;
        this.modelCard = modelCard;
        this.getScore = getScore;
        this.evaluate = evaluate;
        this.monitoring = monitoring;
        this.drift = drift;
    }

    @PostMapping("/score")
    @Operation(summary = "Calcula score thin-file")
    public ResponseEntity<Map<String, Object>> score(@Valid @RequestBody CalculateThinfileScoreRequest req) {
        var r = calculate.execute(new CalculateThinfileScoreUseCase.Command(req.documento(), req.traditionalHistoryCount()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scoreId", r.scoreId().toString());
        body.put("scoreValue", r.scoreValue());
        body.put("confidenceBand", r.confidenceBand());
        body.put("thinFileFlag", r.thinFileFlag());
        body.put("routedToTraditional", r.routedToTraditional());
        body.put("modelVersion", r.modelVersion());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/model-card")
    @Operation(summary = "Ficha do modelo thin-file")
    public Map<String, Object> modelCard() {
        var r = modelCard.execute();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("modelVersion", r.modelVersion());
        body.put("populationDesc", r.populationDesc());
        body.put("auc", r.auc());
        body.put("confidenceFloor", r.confidenceFloor());
        body.put("active", r.active());
        return body;
    }

    @GetMapping("/{documento}")
    @Operation(summary = "Consulta último score thin-file")
    public Map<String, Object> byDocumento(@PathVariable String documento) {
        var r = getScore.execute(new GetThinfileScoreUseCase.Query(documento));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("scoreId", r.scoreId().toString());
        body.put("scoreValue", r.scoreValue());
        body.put("confidenceBand", r.confidenceBand());
        body.put("modelVersion", r.modelVersion());
        body.put("thinFileFlag", r.thinFileFlag());
        return body;
    }

    @GetMapping("/monitoring")
    @Operation(summary = "Painel de performance")
    public Map<String, Object> monitoring() {
        var r = monitoring.execute();
        List<Map<String, Object>> runs = r.runs().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("runId", i.runId().toString());
            m.put("modelVersion", i.modelVersion());
            m.put("status", i.status());
            m.put("aucCurrent", i.aucCurrent());
            m.put("degradationPct", i.degradationPct());
            return m;
        }).toList();
        return Map.of("runs", runs);
    }

    @GetMapping("/drift")
    @Operation(summary = "Deriva de atributos")
    public Map<String, Object> drift() {
        var r = drift.execute();
        List<Map<String, Object>> metrics = r.metrics().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("featureName", i.featureName());
            m.put("psi", i.psi());
            m.put("severity", i.severity());
            m.put("vulnerableSegment", i.vulnerableSegment());
            return m;
        }).toList();
        return Map.of("metrics", metrics);
    }

    @PostMapping("/monitoring/evaluate")
    @Operation(summary = "Apuração periódica de performance")
    public Map<String, Object> evaluate(@RequestBody(required = false) EvaluateMonitoringRequest req) {
        String version = req != null ? req.modelVersion() : null;
        var auc = req != null ? req.aucCurrent() : null;
        var r = evaluate.execute(new EvaluateThinfileMonitoringUseCase.Command(version, auc));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("runId", r.runId().toString());
        body.put("status", r.status());
        body.put("degradationPct", r.degradationPct());
        body.put("actionTaken", r.actionTaken());
        return body;
    }
}
""")
w(TEST / "application/thinfile/ThinfileServiceTest.java", """
package br.com.ebv.prisma.application.thinfile;

import br.com.ebv.prisma.domain.thinfile.port.in.CalculateThinfileScoreUseCase;
import br.com.ebv.prisma.domain.thinfile.port.out.ThinfileRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ThinfileServiceTest {

    @Mock ThinfileRepositoryPort repo;

    @Test
    @DisplayName("F02 calcula score thin-file quando history < 3")
    void calculateThin() {
        when(repo.findActiveModelCard()).thenReturn(Optional.of(new ThinfileRepositoryPort.ModelCard(
                "tf-lab-1.0", Instant.now(), Instant.now(), "lab", new BigDecimal("0.72"),
                new BigDecimal("0.55"), "{}", true
        )));
        var svc = new CalculateThinfileScoreService(repo);
        var r = svc.execute(new CalculateThinfileScoreUseCase.Command("12345678901", 1));
        assertThat(r.thinFileFlag()).isTrue();
        assertThat(r.scoreValue()).isEqualTo(520);
        verify(repo).saveScore(any());
    }
}
""")

print("F02+F09 thinfile done")
