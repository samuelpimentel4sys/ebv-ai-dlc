package br.com.ebv.prisma.domain.mission.port.out;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MissionRepositoryPort {
    record CatalogRecord(UUID missionId, String code, String title, String rulesJson, boolean active) {}
    record EnrollmentRecord(UUID enrollmentId, UUID missionId, String documentoHash, String status, BigDecimal progressPct) {}
    record AchievementRecord(UUID achievementId, String documentoHash, UUID missionId, String code, String title, Instant earnedAt) {}

    List<CatalogRecord> findActiveCatalog();
    Optional<CatalogRecord> findCatalog(UUID missionId);
    Optional<EnrollmentRecord> findEnrollment(UUID missionId, String documentoHash);
    void saveEnrollment(EnrollmentRecord record);
    List<AchievementRecord> findAchievements(String documentoHash);
    void saveAchievement(AchievementRecord record);
}
