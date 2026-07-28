# -*- coding: utf-8 -*-
"""EP-06 lab generator part 4: F03 coach, F06 simulate, F05 missions, F07 marketplace."""
from pathlib import Path
import textwrap

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "src/main/java/br/com/ebv/prisma"
TEST = ROOT / "src/test/java/br/com/ebv/prisma"


def w(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip("\n"), encoding="utf-8")
    print("W", path.relative_to(ROOT))


# ===================== F03 + F06 Coach =====================
w(MAIN / "domain/coach/exception/CoachNotFoundException.java", """
package br.com.ebv.prisma.domain.coach.exception;

public class CoachNotFoundException extends RuntimeException {
    public CoachNotFoundException(String message) { super(message); }
}
""")
w(MAIN / "domain/coach/exception/CoachValidationException.java", """
package br.com.ebv.prisma.domain.coach.exception;

public class CoachValidationException extends RuntimeException {
    public CoachValidationException(String message) { super(message); }
}
""")
w(MAIN / "domain/coach/port/out/CoachRepositoryPort.java", """
package br.com.ebv.prisma.domain.coach.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CoachRepositoryPort {
    record JourneyRecord(UUID journeyId, String documentoHash, String status, Instant startedAt, UUID decisionSnapshotId) {}
    record GoalRecord(UUID goalId, UUID journeyId, String goalType, String title, String estimateText,
                      boolean guaranteesApproval, String status) {}
    record SimulationRecord(UUID simulationId, String documentoHash, UUID snapshotScoreId, String actionCode,
                            boolean estimable, Integer scoreDeltaMin, Integer scoreDeltaMax,
                            Integer effectDaysMin, Integer effectDaysMax, String message, Instant createdAt) {}

    void saveJourney(JourneyRecord record);
    Optional<JourneyRecord> findActiveJourney(String documentoHash);
    Optional<JourneyRecord> findJourney(UUID journeyId);
    void saveGoal(GoalRecord record);
    List<GoalRecord> findGoals(UUID journeyId);
    void saveSimulation(SimulationRecord record);
    List<SimulationRecord> findSimulations(String documentoHash);
}
""")
w(MAIN / "domain/coach/port/in/GetCoachJourneyUseCase.java", """
package br.com.ebv.prisma.domain.coach.port.in;

import java.util.List;
import java.util.UUID;

public interface GetCoachJourneyUseCase {
    record Query(String documento) {}
    record Goal(UUID goalId, String goalType, String title, String estimateText, String status) {}
    record Result(UUID journeyId, String status, List<Goal> goals) {}
    Result execute(Query query);
}
""")
w(MAIN / "domain/coach/port/in/UpsertCoachGoalsUseCase.java", """
package br.com.ebv.prisma.domain.coach.port.in;

import java.util.List;
import java.util.UUID;

public interface UpsertCoachGoalsUseCase {
    record GoalInput(String goalType, String title, String estimateText, Boolean guaranteesApproval) {}
    record Command(String documento, List<GoalInput> goals) {}
    record Item(UUID goalId, String title, String status) {}
    record Result(UUID journeyId, List<Item> goals) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/coach/port/in/GetCoachProgressUseCase.java", """
package br.com.ebv.prisma.domain.coach.port.in;

import java.math.BigDecimal;
import java.util.UUID;

public interface GetCoachProgressUseCase {
    record Query(String documento) {}
    record Result(UUID journeyId, BigDecimal percentComplete, int goalsDone, int goalsTotal) {}
    Result execute(Query query);
}
""")
w(MAIN / "domain/coach/port/in/SimulateCoachActionUseCase.java", """
package br.com.ebv.prisma.domain.coach.port.in;

import java.util.UUID;

public interface SimulateCoachActionUseCase {
    record Command(String documento, String actionCode, UUID snapshotScoreId) {}
    record Result(UUID simulationId, boolean estimable, Integer scoreDeltaMin, Integer scoreDeltaMax,
                  Integer effectDaysMin, Integer effectDaysMax, String message) {}
    Result execute(Command command);
}
""")
w(MAIN / "domain/coach/port/in/GetCoachSimulationHistoryUseCase.java", """
package br.com.ebv.prisma.domain.coach.port.in;

import java.util.List;
import java.util.UUID;

public interface GetCoachSimulationHistoryUseCase {
    record Query(String documento) {}
    record Item(UUID simulationId, String actionCode, boolean estimable, String message) {}
    record Result(List<Item> simulations) {}
    Result execute(Query query);
}
""")
w(MAIN / "application/coach/GetCoachJourneyService.java", """
package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachJourneyUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class GetCoachJourneyService implements GetCoachJourneyUseCase {

    private final CoachRepositoryPort repo;

    public GetCoachJourneyService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new CoachValidationException("documento obrigatório");
        }
        String hash = sha256(query.documento().trim());
        var journey = repo.findActiveJourney(hash).orElseGet(() -> {
            UUID id = UUID.randomUUID();
            var created = new CoachRepositoryPort.JourneyRecord(id, hash, "ACTIVE", Instant.now(), null);
            repo.saveJourney(created);
            repo.saveGoal(new CoachRepositoryPort.GoalRecord(
                    UUID.randomUUID(), id, "PAY_ON_TIME", "Pague contas em dia",
                    "Estimativa: +20 a +40 pts em 90 dias", false, "SUGGESTED"
            ));
            return created;
        });
        List<Goal> goals = repo.findGoals(journey.journeyId()).stream()
                .map(g -> new Goal(g.goalId(), g.goalType(), g.title(), g.estimateText(), g.status()))
                .toList();
        return new Result(journey.journeyId(), journey.status(), goals);
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
w(MAIN / "application/coach/UpsertCoachGoalsService.java", """
package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.UpsertCoachGoalsUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UpsertCoachGoalsService implements UpsertCoachGoalsUseCase {

    private final CoachRepositoryPort repo;

    public UpsertCoachGoalsService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.goals() == null || command.goals().isEmpty()) {
            throw new CoachValidationException("documento e goals obrigatórios");
        }
        for (GoalInput g : command.goals()) {
            if (Boolean.TRUE.equals(g.guaranteesApproval())) {
                throw new CoachValidationException("texto com garantia de aprovação bloqueado (RN-01)");
            }
            String text = (g.title() != null ? g.title() : "") + " " + (g.estimateText() != null ? g.estimateText() : "");
            if (text.toLowerCase().contains("garantia de aprovação") || text.toLowerCase().contains("aprovação garantida")) {
                throw new CoachValidationException("texto com garantia de aprovação bloqueado (RN-01)");
            }
        }
        String hash = GetCoachJourneyService.sha256(command.documento().trim());
        var journey = repo.findActiveJourney(hash).orElseGet(() -> {
            UUID id = UUID.randomUUID();
            var created = new CoachRepositoryPort.JourneyRecord(id, hash, "ACTIVE", Instant.now(), null);
            repo.saveJourney(created);
            return created;
        });
        List<Item> out = new ArrayList<>();
        for (GoalInput g : command.goals()) {
            UUID gid = UUID.randomUUID();
            repo.saveGoal(new CoachRepositoryPort.GoalRecord(
                    gid, journey.journeyId(),
                    g.goalType() != null ? g.goalType() : "CUSTOM",
                    g.title(), g.estimateText() != null ? g.estimateText() : "",
                    false, "ACTIVE"
            ));
            out.add(new Item(gid, g.title(), "ACTIVE"));
        }
        return new Result(journey.journeyId(), out);
    }
}
""")
w(MAIN / "application/coach/GetCoachProgressService.java", """
package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachNotFoundException;
import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachProgressUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class GetCoachProgressService implements GetCoachProgressUseCase {

    private final CoachRepositoryPort repo;

    public GetCoachProgressService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new CoachValidationException("documento obrigatório");
        }
        String hash = GetCoachJourneyService.sha256(query.documento().trim());
        var journey = repo.findActiveJourney(hash)
                .orElseThrow(() -> new CoachNotFoundException("jornada não encontrada"));
        var goals = repo.findGoals(journey.journeyId());
        int total = goals.size();
        int done = (int) goals.stream().filter(g -> "DONE".equals(g.status())).count();
        BigDecimal pct = total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(done * 100.0 / total).setScale(2, RoundingMode.HALF_UP);
        return new Result(journey.journeyId(), pct, done, total);
    }
}
""")
w(MAIN / "application/coach/SimulateCoachActionService.java", """
package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.SimulateCoachActionUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class SimulateCoachActionService implements SimulateCoachActionUseCase {

    private final CoachRepositoryPort repo;

    public SimulateCoachActionService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional
    public Result execute(Command command) {
        if (command.documento() == null || command.actionCode() == null) {
            throw new CoachValidationException("documento e actionCode obrigatórios");
        }
        UUID simId = UUID.randomUUID();
        UUID snapshot = command.snapshotScoreId() != null ? command.snapshotScoreId() : UUID.randomUUID();
        boolean estimable = !"UNKNOWN".equalsIgnoreCase(command.actionCode());
        Integer min = estimable ? 10 : null;
        Integer max = estimable ? 35 : null;
        Integer dMin = estimable ? 30 : null;
        Integer dMax = estimable ? 90 : null;
        String msg = estimable
                ? "Estimativa lab: efeito positivo possível, sem garantia de aprovação"
                : "Ação não estimável no modelo atual";
        repo.saveSimulation(new CoachRepositoryPort.SimulationRecord(
                simId, GetCoachJourneyService.sha256(command.documento().trim()), snapshot,
                command.actionCode(), estimable, min, max, dMin, dMax, msg, Instant.now()
        ));
        return new Result(simId, estimable, min, max, dMin, dMax, msg);
    }
}
""")
w(MAIN / "application/coach/GetCoachSimulationHistoryService.java", """
package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachSimulationHistoryUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetCoachSimulationHistoryService implements GetCoachSimulationHistoryUseCase {

    private final CoachRepositoryPort repo;

    public GetCoachSimulationHistoryService(CoachRepositoryPort repo) { this.repo = repo; }

    @Override
    @Transactional(readOnly = true)
    public Result execute(Query query) {
        if (query.documento() == null || query.documento().isBlank()) {
            throw new CoachValidationException("documento obrigatório");
        }
        var items = repo.findSimulations(GetCoachJourneyService.sha256(query.documento().trim())).stream()
                .map(s -> new Item(s.simulationId(), s.actionCode(), s.estimable(), s.message()))
                .toList();
        return new Result(items);
    }
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachJourneyEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_coach_journey")
public class CoachJourneyEntity {
    @Id @Column(name = "journey_id") private UUID journeyId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(nullable = false) private String status;
    @Column(name = "started_at", nullable = false) private OffsetDateTime startedAt;
    @Column(name = "decision_snapshot_id") private UUID decisionSnapshotId;
    @Column(name = "updated_at", nullable = false) private OffsetDateTime updatedAt;

    public UUID getJourneyId() { return journeyId; }
    public void setJourneyId(UUID journeyId) { this.journeyId = journeyId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public UUID getDecisionSnapshotId() { return decisionSnapshotId; }
    public void setDecisionSnapshotId(UUID decisionSnapshotId) { this.decisionSnapshotId = decisionSnapshotId; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachGoalEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_coach_goal")
public class CoachGoalEntity {
    @Id @Column(name = "goal_id") private UUID goalId;
    @Column(name = "journey_id", nullable = false) private UUID journeyId;
    @Column(name = "goal_type", nullable = false) private String goalType;
    @Column(nullable = false) private String title;
    @Column(name = "estimate_text", nullable = false) private String estimateText;
    @Column(name = "guarantees_approval", nullable = false) private Boolean guaranteesApproval;
    @Column(nullable = false) private String status;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }
    public UUID getJourneyId() { return journeyId; }
    public void setJourneyId(UUID journeyId) { this.journeyId = journeyId; }
    public String getGoalType() { return goalType; }
    public void setGoalType(String goalType) { this.goalType = goalType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEstimateText() { return estimateText; }
    public void setEstimateText(String estimateText) { this.estimateText = estimateText; }
    public Boolean getGuaranteesApproval() { return guaranteesApproval; }
    public void setGuaranteesApproval(Boolean guaranteesApproval) { this.guaranteesApproval = guaranteesApproval; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachSimulationEntity.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tb_coach_simulation")
public class CoachSimulationEntity {
    @Id @Column(name = "simulation_id") private UUID simulationId;
    @Column(name = "documento_hash", nullable = false) private String documentoHash;
    @Column(name = "snapshot_score_id", nullable = false) private UUID snapshotScoreId;
    @Column(name = "action_code", nullable = false) private String actionCode;
    @Column(nullable = false) private Boolean estimable;
    @Column(name = "score_delta_min") private Integer scoreDeltaMin;
    @Column(name = "score_delta_max") private Integer scoreDeltaMax;
    @Column(name = "effect_days_min") private Integer effectDaysMin;
    @Column(name = "effect_days_max") private Integer effectDaysMax;
    @Column(nullable = false) private String message;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;

    public UUID getSimulationId() { return simulationId; }
    public void setSimulationId(UUID simulationId) { this.simulationId = simulationId; }
    public String getDocumentoHash() { return documentoHash; }
    public void setDocumentoHash(String documentoHash) { this.documentoHash = documentoHash; }
    public UUID getSnapshotScoreId() { return snapshotScoreId; }
    public void setSnapshotScoreId(UUID snapshotScoreId) { this.snapshotScoreId = snapshotScoreId; }
    public String getActionCode() { return actionCode; }
    public void setActionCode(String actionCode) { this.actionCode = actionCode; }
    public Boolean getEstimable() { return estimable; }
    public void setEstimable(Boolean estimable) { this.estimable = estimable; }
    public Integer getScoreDeltaMin() { return scoreDeltaMin; }
    public void setScoreDeltaMin(Integer scoreDeltaMin) { this.scoreDeltaMin = scoreDeltaMin; }
    public Integer getScoreDeltaMax() { return scoreDeltaMax; }
    public void setScoreDeltaMax(Integer scoreDeltaMax) { this.scoreDeltaMax = scoreDeltaMax; }
    public Integer getEffectDaysMin() { return effectDaysMin; }
    public void setEffectDaysMin(Integer effectDaysMin) { this.effectDaysMin = effectDaysMin; }
    public Integer getEffectDaysMax() { return effectDaysMax; }
    public void setEffectDaysMax(Integer effectDaysMax) { this.effectDaysMax = effectDaysMax; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachJourneyJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CoachJourneyJpaRepository extends JpaRepository<CoachJourneyEntity, UUID> {
    Optional<CoachJourneyEntity> findFirstByDocumentoHashAndStatus(String documentoHash, String status);
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachGoalJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CoachGoalJpaRepository extends JpaRepository<CoachGoalEntity, UUID> {
    List<CoachGoalEntity> findByJourneyIdOrderByCreatedAtAsc(UUID journeyId);
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachSimulationJpaRepository.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CoachSimulationJpaRepository extends JpaRepository<CoachSimulationEntity, UUID> {
    List<CoachSimulationEntity> findByDocumentoHashOrderByCreatedAtDesc(String documentoHash);
}
""")
w(MAIN / "infrastructure/adapter/persistence/coach/CoachRepositoryAdapter.java", """
package br.com.ebv.prisma.infrastructure.adapter.persistence.coach;

import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Transactional
public class CoachRepositoryAdapter implements CoachRepositoryPort {

    private final CoachJourneyJpaRepository journeyJpa;
    private final CoachGoalJpaRepository goalJpa;
    private final CoachSimulationJpaRepository simJpa;

    public CoachRepositoryAdapter(
            CoachJourneyJpaRepository journeyJpa,
            CoachGoalJpaRepository goalJpa,
            CoachSimulationJpaRepository simJpa
    ) {
        this.journeyJpa = journeyJpa;
        this.goalJpa = goalJpa;
        this.simJpa = simJpa;
    }

    @Override
    public void saveJourney(JourneyRecord record) {
        CoachJourneyEntity e = new CoachJourneyEntity();
        e.setJourneyId(record.journeyId());
        e.setDocumentoHash(record.documentoHash());
        e.setStatus(record.status());
        e.setStartedAt(OffsetDateTime.ofInstant(record.startedAt(), ZoneOffset.UTC));
        e.setDecisionSnapshotId(record.decisionSnapshotId());
        e.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        journeyJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<JourneyRecord> findActiveJourney(String documentoHash) {
        return journeyJpa.findFirstByDocumentoHashAndStatus(documentoHash, "ACTIVE").map(this::toJourney);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<JourneyRecord> findJourney(UUID journeyId) {
        return journeyJpa.findById(journeyId).map(this::toJourney);
    }

    @Override
    public void saveGoal(GoalRecord record) {
        CoachGoalEntity e = new CoachGoalEntity();
        e.setGoalId(record.goalId());
        e.setJourneyId(record.journeyId());
        e.setGoalType(record.goalType());
        e.setTitle(record.title());
        e.setEstimateText(record.estimateText());
        e.setGuaranteesApproval(record.guaranteesApproval());
        e.setStatus(record.status());
        e.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        goalJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GoalRecord> findGoals(UUID journeyId) {
        return goalJpa.findByJourneyIdOrderByCreatedAtAsc(journeyId).stream()
                .map(e -> new GoalRecord(e.getGoalId(), e.getJourneyId(), e.getGoalType(), e.getTitle(),
                        e.getEstimateText(), Boolean.TRUE.equals(e.getGuaranteesApproval()), e.getStatus()))
                .toList();
    }

    @Override
    public void saveSimulation(SimulationRecord record) {
        CoachSimulationEntity e = new CoachSimulationEntity();
        e.setSimulationId(record.simulationId());
        e.setDocumentoHash(record.documentoHash());
        e.setSnapshotScoreId(record.snapshotScoreId());
        e.setActionCode(record.actionCode());
        e.setEstimable(record.estimable());
        e.setScoreDeltaMin(record.scoreDeltaMin());
        e.setScoreDeltaMax(record.scoreDeltaMax());
        e.setEffectDaysMin(record.effectDaysMin());
        e.setEffectDaysMax(record.effectDaysMax());
        e.setMessage(record.message());
        e.setCreatedAt(OffsetDateTime.ofInstant(record.createdAt(), ZoneOffset.UTC));
        simJpa.save(e);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SimulationRecord> findSimulations(String documentoHash) {
        return simJpa.findByDocumentoHashOrderByCreatedAtDesc(documentoHash).stream()
                .map(e -> new SimulationRecord(
                        e.getSimulationId(), e.getDocumentoHash(), e.getSnapshotScoreId(), e.getActionCode(),
                        e.getEstimable(), e.getScoreDeltaMin(), e.getScoreDeltaMax(),
                        e.getEffectDaysMin(), e.getEffectDaysMax(), e.getMessage(), e.getCreatedAt().toInstant()))
                .toList();
    }

    private JourneyRecord toJourney(CoachJourneyEntity e) {
        return new JourneyRecord(e.getJourneyId(), e.getDocumentoHash(), e.getStatus(),
                e.getStartedAt().toInstant(), e.getDecisionSnapshotId());
    }
}
""")
w(MAIN / "presentation/dto/coach/UpsertCoachGoalsRequest.java", """
package br.com.ebv.prisma.presentation.dto.coach;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpsertCoachGoalsRequest(
        @NotBlank String documento,
        @NotEmpty List<Goal> goals
) {
    public record Goal(String goalType, String title, String estimateText, Boolean guaranteesApproval) {}
}
""")
w(MAIN / "presentation/dto/coach/SimulateCoachActionRequest.java", """
package br.com.ebv.prisma.presentation.dto.coach;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record SimulateCoachActionRequest(
        @NotBlank String documento,
        @NotBlank String actionCode,
        UUID snapshotScoreId
) {}
""")
w(MAIN / "presentation/controller/CoachController.java", """
package br.com.ebv.prisma.presentation.controller;

import br.com.ebv.prisma.domain.coach.port.in.GetCoachJourneyUseCase;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachProgressUseCase;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachSimulationHistoryUseCase;
import br.com.ebv.prisma.domain.coach.port.in.SimulateCoachActionUseCase;
import br.com.ebv.prisma.domain.coach.port.in.UpsertCoachGoalsUseCase;
import br.com.ebv.prisma.presentation.dto.coach.SimulateCoachActionRequest;
import br.com.ebv.prisma.presentation.dto.coach.UpsertCoachGoalsRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coach")
@Tag(name = "Coach", description = "PRISMA-EP-06-F03/F06 Jornada + simulação de efeito")
public class CoachController {

    private final GetCoachJourneyUseCase journey;
    private final UpsertCoachGoalsUseCase goals;
    private final GetCoachProgressUseCase progress;
    private final SimulateCoachActionUseCase simulate;
    private final GetCoachSimulationHistoryUseCase history;

    public CoachController(
            GetCoachJourneyUseCase journey,
            UpsertCoachGoalsUseCase goals,
            GetCoachProgressUseCase progress,
            SimulateCoachActionUseCase simulate,
            GetCoachSimulationHistoryUseCase history
    ) {
        this.journey = journey;
        this.goals = goals;
        this.progress = progress;
        this.simulate = simulate;
        this.history = history;
    }

    @GetMapping("/journey")
    @Operation(summary = "Monta trilha personalizada")
    public Map<String, Object> journey(@RequestParam String documento) {
        var r = journey.execute(new GetCoachJourneyUseCase.Query(documento));
        List<Map<String, Object>> goalsOut = r.goals().stream().map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("goalId", g.goalId().toString());
            m.put("goalType", g.goalType());
            m.put("title", g.title());
            m.put("estimateText", g.estimateText());
            m.put("status", g.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("journeyId", r.journeyId().toString());
        body.put("status", r.status());
        body.put("goals", goalsOut);
        return body;
    }

    @PostMapping("/goals")
    @Operation(summary = "Define/atualiza metas")
    public Map<String, Object> goals(@Valid @RequestBody UpsertCoachGoalsRequest req) {
        var inputs = req.goals().stream()
                .map(g -> new UpsertCoachGoalsUseCase.GoalInput(g.goalType(), g.title(), g.estimateText(), g.guaranteesApproval()))
                .toList();
        var r = goals.execute(new UpsertCoachGoalsUseCase.Command(req.documento(), inputs));
        List<Map<String, Object>> out = r.goals().stream().map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("goalId", g.goalId().toString());
            m.put("title", g.title());
            m.put("status", g.status());
            return m;
        }).toList();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("journeyId", r.journeyId().toString());
        body.put("goals", out);
        return body;
    }

    @GetMapping("/progress")
    @Operation(summary = "Apura progresso")
    public Map<String, Object> progress(@RequestParam String documento) {
        var r = progress.execute(new GetCoachProgressUseCase.Query(documento));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("journeyId", r.journeyId().toString());
        body.put("percentComplete", r.percentComplete());
        body.put("goalsDone", r.goalsDone());
        body.put("goalsTotal", r.goalsTotal());
        return body;
    }

    @PostMapping("/simulate")
    @Operation(summary = "Estima efeito de ação")
    public Map<String, Object> simulate(@Valid @RequestBody SimulateCoachActionRequest req) {
        var r = simulate.execute(new SimulateCoachActionUseCase.Command(
                req.documento(), req.actionCode(), req.snapshotScoreId()));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("simulationId", r.simulationId().toString());
        body.put("estimable", r.estimable());
        body.put("scoreDeltaMin", r.scoreDeltaMin());
        body.put("scoreDeltaMax", r.scoreDeltaMax());
        body.put("effectDaysMin", r.effectDaysMin());
        body.put("effectDaysMax", r.effectDaysMax());
        body.put("message", r.message());
        return body;
    }

    @GetMapping("/simulations/history")
    @Operation(summary = "Histórico de simulações")
    public Map<String, Object> history(@RequestParam String documento) {
        var r = history.execute(new GetCoachSimulationHistoryUseCase.Query(documento));
        List<Map<String, Object>> sims = r.simulations().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("simulationId", s.simulationId().toString());
            m.put("actionCode", s.actionCode());
            m.put("estimable", s.estimable());
            m.put("message", s.message());
            return m;
        }).toList();
        return Map.of("simulations", sims);
    }
}
""")
w(TEST / "application/coach/CoachServiceTest.java", """
package br.com.ebv.prisma.application.coach;

import br.com.ebv.prisma.domain.coach.exception.CoachValidationException;
import br.com.ebv.prisma.domain.coach.port.in.GetCoachJourneyUseCase;
import br.com.ebv.prisma.domain.coach.port.in.UpsertCoachGoalsUseCase;
import br.com.ebv.prisma.domain.coach.port.out.CoachRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CoachServiceTest {

    @Mock CoachRepositoryPort repo;

    @Test
    @DisplayName("F03 cria jornada lab com meta sugerida")
    void journeyCreates() {
        when(repo.findActiveJourney(anyString())).thenReturn(Optional.empty());
        when(repo.findGoals(any())).thenReturn(List.of());
        var svc = new GetCoachJourneyService(repo);
        var r = svc.execute(new GetCoachJourneyUseCase.Query("12345678901"));
        assertThat(r.status()).isEqualTo("ACTIVE");
        assertThat(r.journeyId()).isNotNull();
    }

    @Test
    @DisplayName("F03 bloqueia garantia de aprovação")
    void blocksGuarantee() {
        var svc = new UpsertCoachGoalsService(repo);
        assertThatThrownBy(() -> svc.execute(new UpsertCoachGoalsUseCase.Command(
                "12345678901",
                List.of(new UpsertCoachGoalsUseCase.GoalInput("PAY", "Meta", "aprovação garantida", false))
        ))).isInstanceOf(CoachValidationException.class);
    }
}
""")

print("coach F03/F06 done")
