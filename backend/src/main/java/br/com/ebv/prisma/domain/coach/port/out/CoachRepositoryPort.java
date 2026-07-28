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
