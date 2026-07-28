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
